import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import IDCard from '../components/common/IDCard';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Download, Printer, Loader, View } from 'lucide-react';
import Lanyard from '../components/common/Lanyard/Lanyard';
import { Suspense } from 'react';
import StudyMateLoader from '../components/common/StudyMateLoader';

const DigitalIDCard = () => {
  const { currentUser } = useContext(AuthContext);
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [show3D, setShow3D] = useState(false);
  const [cardImage, setCardImage] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    const fetchIDCard = async () => {
      try {
        const res = await api.get('/id-card/mine');
        setCardData(res.data.data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load ID Card');
      } finally {
        setLoading(false);
      }
    };
    fetchIDCard();
  }, []);

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    
    const element = printRef.current;
    
    try {
      toast.loading('Generating PDF...', { id: 'pdf-toast' });
      const imgData = await toPng(element, { pixelRatio: 3, style: { transform: 'scale(1)' } });
      
      // ID Card Dimensions: ~54mm x 86mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [54, 86]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, 54, 86);
      pdf.save(`ID_Card_${cardData.name.replace(/\s+/g, '_')}.pdf`);
      toast.success('Downloaded Successfully', { id: 'pdf-toast' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate PDF', { id: 'pdf-toast' });
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    
    const windowPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
    windowPrint.document.write(`
      <html>
        <head>
          <title>Print ID Card</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: white; }
            @media print {
              @page { size: 54mm 86mm; margin: 0; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);
    windowPrint.document.close();
    windowPrint.focus();
    setTimeout(() => {
      windowPrint.print();
      windowPrint.close();
    }, 250);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl shadow-soft">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Digital ID Card</h1>
            <p className="text-gray-500">View, download, or print your official school ID card.</p>
          </div>
          
          {cardData && cardData.idCardStatus === 'active' && (
            <div className="flex flex-wrap gap-3 mt-4 md:mt-0 justify-end">
              <button onClick={async () => {
                if (!show3D) {
                  toast.loading('Generating 3D View...', { id: '3d-toast' });
                  try {
                    const imgData = await toPng(printRef.current, { 
                      pixelRatio: 2, 
                      style: { transform: 'scale(1)' }
                    });
                    setCardImage(imgData);
                    setShow3D(true);
                    toast.success('Ready to interact!', { id: '3d-toast' });
                  } catch (e) {
                    console.error("3D View Generation Error:", e);
                    toast.error(e.message || 'Failed to load 3D view', { id: '3d-toast' });
                  }
                } else {
                  setShow3D(false);
                }
              }} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${show3D ? 'bg-primary text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                <View className="w-4 h-4" /> {show3D ? 'View Standard 2D' : 'View in 3D'}
              </button>
              <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-semibold hover:bg-gray-200 transition">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-semibold hover:bg-primary-dark transition shadow-sm">
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <StudyMateLoader size="md" />
            <p className="text-gray-500 font-medium mt-4">Generating ID Card...</p>
          </div>
        ) : !cardData ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-center border border-red-100">
            Could not retrieve ID Card information.
          </div>
        ) : cardData.idCardStatus !== 'active' ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-center border border-red-100 font-medium text-lg">
            Your ID Card is currently {cardData.idCardStatus}. Please contact the Principal.
          </div>
        ) : (
          <div className="bg-gray-50 rounded-3xl border border-gray-100 flex justify-center shadow-inner overflow-hidden relative" style={{ minHeight: '600px' }}>
            
            {show3D && cardImage ? (
              <div className="w-full h-[600px] absolute inset-0 cursor-grab active:cursor-grabbing">
                <Suspense fallback={<div className="flex w-full h-full items-center justify-center"><StudyMateLoader size="sm" /></div>}>
                  <Lanyard frontImage={cardImage} backImage={cardImage} />
                </Suspense>
                <div className="absolute bottom-4 left-0 w-full text-center text-sm font-semibold text-gray-400 pointer-events-none uppercase tracking-widest">
                  Drag card to interact
                </div>
              </div>
            ) : (
              <div className="relative p-8 md:p-12">
                {/* Optional 3D Lanyard Preview Placeholder */}
                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-4 h-24 bg-gradient-to-b from-gray-800 to-gray-600 rounded-sm z-[-1] hidden md:block"></div>
                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-gray-300 border-2 border-gray-800 z-30 hidden md:block mt-20"></div>
                
                <div ref={printRef} className="bg-white rounded-2xl">
                  <IDCard user={cardData} isPrint={true} />
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </Layout>
  );
};

export default DigitalIDCard;
