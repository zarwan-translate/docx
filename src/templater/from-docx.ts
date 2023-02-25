import * as JSZip from "jszip";
import { Element, js2xml } from "xml-js";

import { ParagraphChild } from "@file/paragraph";
import { FileChild } from "@file/file-child";

import { replacer } from "./replacer";
import { findLocationOfText } from "./traverser";
import { toJson } from "./util";

// eslint-disable-next-line functional/prefer-readonly-type
type InputDataType = Buffer | string | number[] | Uint8Array | ArrayBuffer | Blob | NodeJS.ReadableStream;

export enum PatchType {
    DOCUMENT = "file",
    PARAGRAPH = "paragraph",
}

type ParagraphPatch = {
    readonly type: PatchType.PARAGRAPH;
    readonly children: readonly ParagraphChild[];
};

type FilePatch = {
    readonly type: PatchType.DOCUMENT;
    readonly children: readonly FileChild[];
};

export type IPatch = {
    readonly text: string;
} & (ParagraphPatch | FilePatch);

export interface PatchDocumentOptions {
    readonly patches: readonly IPatch[];
}

export const patchDocument = async (data: InputDataType, options: PatchDocumentOptions): Promise<Buffer> => {
    const zipContent = await JSZip.loadAsync(data);

    const map = new Map<string, Element>();

    for (const [key, value] of Object.entries(zipContent.files)) {
        const json = toJson(await value.async("text"));
        if (key === "word/document.xml") {
            for (const patch of options.patches) {
                const renderedParagraphs = findLocationOfText(json, patch.text);
                replacer(json, patch, renderedParagraphs);
            }
        }

        map.set(key, json);
    }

    const zip = new JSZip();

    for (const [key, value] of map) {
        const output = toXml(value);

        zip.file(key, output);
    }

    const zipData = await zip.generateAsync({
        type: "nodebuffer",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        compression: "DEFLATE",
    });

    return zipData;
};

const toXml = (jsonObj: Element): string => {
    const output = js2xml(jsonObj);
    return output;
};
