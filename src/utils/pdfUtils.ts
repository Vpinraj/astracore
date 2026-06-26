import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportAndSharePdf = async (elementId: string, filename: string) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with id ${elementId} not found`);
      return;
    }

    // Store original styles to restore later
    const originalMaxHeight = element.style.maxHeight;
    const originalOverflow = element.style.overflow;
    
    // Temporarily adjust styles for full capture
    element.style.maxHeight = 'none';
    element.style.overflow = 'visible';

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#09090b', // matches zinc-950
    });

    // Restore original styles
    element.style.maxHeight = originalMaxHeight;
    element.style.overflow = originalOverflow;

    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'l' : 'p',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    const pdfBlob = pdf.output('blob');

    // Try Web Share API for email/chat sharing support
    if (navigator.share && navigator.canShare) {
      const file = new File([pdfBlob], `${filename}.pdf`, { type: 'application/pdf' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: filename,
            text: `Here is the exported document: ${filename}`,
          });
          return; // Shared successfully
        } catch (err) {
          console.log('Share action cancelled or failed, falling back to download', err);
        }
      }
    }

    // Fallback: Download directly
    pdf.save(`${filename}.pdf`);
  } catch (err) {
    console.error('Error generating PDF', err);
    alert('Failed to generate PDF document.');
  }
};
