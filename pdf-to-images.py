import fitz  # PyMuPDF
import os

pdf_path = "pdfcoffee.com_menschen-a11-arbeitsbuch-pdf-free.pdf"
output_dir = "pdf-pages"

os.makedirs(output_dir, exist_ok=True)

doc = fitz.open(pdf_path)
print(f"Total pages: {doc.page_count}")

for i in range(doc.page_count):
    page = doc[i]
    # Render at 200 DPI for good quality
    pix = page.get_pixmap(dpi=200)
    out_path = os.path.join(output_dir, f"page-{i+1:03d}.png")
    pix.save(out_path)
    print(f"Page {i+1}/{doc.page_count} -> {out_path}")

print("Done!")
