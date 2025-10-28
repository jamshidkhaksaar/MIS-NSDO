declare module "pdfkit" {
  interface PDFDocumentOptions {
    size?: string | [number, number];
    margins?: { top?: number; bottom?: number; left?: number; right?: number };
    info?: Record<string, unknown>;
  }

  interface PDFPage {
    margins: { top: number; bottom: number; left: number; right: number };
    width: number;
    height: number;
  }

  class PDFDocument {
    constructor(options?: PDFDocumentOptions);
    page: PDFPage;
    x: number;
    y: number;
    addPage(options?: PDFDocumentOptions): this;
    on(event: "data", listener: (chunk: Buffer) => void): this;
    on(event: "end", listener: () => void): this;
    on(event: "error", listener: (error: unknown) => void): this;
    font(name: string): this;
    fontSize(size: number): this;
    text(text: string, options?: Record<string, unknown>): this;
    text(text: string, x: number, y: number, options?: Record<string, unknown>): this;
    moveDown(lines?: number): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    strokeColor(color: string): this;
    stroke(): this;
    fillColor(color: string): this;
    widthOfString(text: string): number;
    rect(x: number, y: number, width: number, height: number): this;
    fill(color?: string): this;
    image(src: Buffer | string, x: number, y: number, options?: Record<string, unknown>): this;
    end(): void;
  }

  export default PDFDocument;
}
