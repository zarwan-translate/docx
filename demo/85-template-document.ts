// Simple template example
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Paragraph, patchDocument, TextRun } from "../build";

patchDocument(fs.readFileSync("demo/assets/simple-template.docx"), {
    patches: [
        {
            children: [new Paragraph("ff"), new TextRun("fgf")],
            text: "{{ name }}",
        },
    ],
}).then((doc) => {
    fs.writeFileSync("My Document.docx", doc);
});
