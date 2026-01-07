import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { StoreIconDisplay } from './StoreIcons';
import { ArrowBackIcon } from './Icons';

const ReceiptModal = ({ transaction, onClose }) => {
    const receiptRef = useRef(null);

    if (!transaction) return null;

    // --- 1. Data Extraction ---
    const txnId = transaction.id || transaction.transaction_id || "N/A";
    const shopName = transaction.store_name || transaction.display_name || transaction.name || "Store";
    const shopAddress = transaction.store_address || transaction.address || transaction.location || transaction.location_text || "Location unavailable";
    const logo = transaction.store_logo || transaction.icon_id || "store_1";
    const txnDate = transaction.created_at || transaction.date || new Date().toISOString();
    const totalAmount = transaction.amount || 0;

    // --- 2. Metadata Parsing ---
    let items = [];
    try {
        const meta = transaction.metadata;
        if (typeof meta === 'string') {
            const parsed = JSON.parse(meta);
            items = parsed.items || [];
        } else if (meta && typeof meta === 'object') {
            items = meta.items || [];
        }
    } catch (e) {
        console.error("Error parsing receipt items:", e);
    }

    // --- Date Formatting ---
    const dateObj = new Date(txnDate);
    const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

    // --- Download Handler ---
    const handleDownload = async () => {
        if (!receiptRef.current) return;
        try {
            const canvas = await html2canvas(receiptRef.current, {
                scale: 3, 
                useCORS: true,
                backgroundColor: "#ffffff", 
                onclone: (clonedDoc) => {
                    const elements = clonedDoc.querySelectorAll('*');
                    elements.forEach(el => {
                        const style = window.getComputedStyle(el);
                        if (style.color.includes('oklch')) el.style.color = '#000000';
                        if (style.borderColor.includes('oklch')) el.style.borderColor = '#e5e7eb';
                    });
                }
            });
            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = image;
            link.download = `Receipt_${txnId}.png`;
            link.click();
        } catch (error) {
            console.error("Receipt generation failed", error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-[380px] overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header Controls */}
                <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-100">
                    <button onClick={onClose} className="text-gray-500 hover:bg-gray-200 p-2 rounded-full transition-colors">
                        <ArrowBackIcon className="w-5 h-5" />
                    </button>
                    <span className="font-bold text-gray-700">Transaction Receipt</span>
                    <button onClick={handleDownload} className="text-blue-600 bg-blue-50 p-2 rounded-full hover:bg-blue-100 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    </button>
                </div>

                {/* --- RECEIPT CONTENT (Captured Area) --- */}
                <div 
                    ref={receiptRef} 
                    className="p-6 overflow-y-auto"
                    style={{ backgroundColor: '#ffffff', color: '#1f2937' }} 
                >
                    
                    {/* Shop Info */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg p-1" style={{ border: '1px solid #e5e7eb' }}>
                                <StoreIconDisplay iconId={logo} className="w-full h-full object-contain" />
                            </div>
                            <h2 className="text-lg font-extrabold w-32 leading-tight" style={{ color: '#111827' }}>
                                {shopName}
                            </h2>
                        </div>
                        
                        {/* ✅ FIX: Address Formatting */}
                        <div className="text-right text-[10px] w-32 leading-snug" style={{ color: '#6b7280' }}>
                            {/* Bold Address Label */}
                            <div style={{ fontWeight: 'bold', color: '#111827', marginBottom: '2px' }}>
                                Address
                            </div>
                            
                            {/* Split address by comma and render new lines */}
                            {shopAddress.split(',').map((line, index) => (
                                <div key={index}>
                                    {line.trim()}{index < shopAddress.split(',').length - 1 ? ',' : ''}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Date/Time */}
                    <div className="text-xs mb-4 space-y-1 font-medium" style={{ color: '#374151' }}>
                        <div className="flex"><span className="w-12 font-bold">Date:</span><span>{dateStr}</span></div>
                        <div className="flex"><span className="w-12 font-bold">Time:</span><span>{timeStr}</span></div>
                    </div>

                    {/* Separator */}
                    <div className="my-4" style={{ borderBottom: '2px dashed #d1d5db' }}></div>

                    {/* Txn ID */}
                    <div className="text-center mb-4">
                        <span className="text-sm font-bold" style={{ color: '#1f2937' }}>
                            Txn ID: {String(txnId).slice(0, 16).toUpperCase()}
                        </span>
                    </div>

                    <div className="my-4" style={{ borderBottom: '2px dashed #d1d5db' }}></div>

                    {/* Items Header */}
                    <div className="flex text-xs font-bold uppercase mb-2" style={{ color: '#000000' }}>
                        <div className="flex-1">Item List</div>
                        <div className="w-10 text-center">Qt.</div>
                        <div className="w-14 text-right">Price</div>
                    </div>
                    <div className="mb-3" style={{ borderBottom: '1px dashed #d1d5db' }}></div>

                    {/* Items List */}
                    <div className="space-y-2 mb-4">
                        {items.length > 0 ? items.map((item, idx) => (
                            <div key={idx} className="flex text-xs" style={{ color: '#374151' }}>
                                <div className="flex-1 pr-2 leading-tight">{item.name}</div>
                                <div className="w-10 text-center">{item.qty || item.quantity || 0}</div>
                                <div className="w-14 text-right font-medium">₹ {item.total || (item.price * (item.qty || item.quantity || 1))}</div>
                            </div>
                        )) : (
                            <div className="text-center text-xs py-2" style={{ color: '#9ca3af' }}>
                                No item details available
                            </div>
                        )}
                    </div>

                    <div className="my-4" style={{ borderBottom: '2px dashed #d1d5db' }}></div>

                    {/* Total */}
                    <div className="flex justify-between items-center text-sm font-bold mb-6" style={{ color: '#111827' }}>
                        <span>Total</span>
                        <span>{items.reduce((acc, i) => acc + (Number(i.qty) || Number(i.quantity) || 0), 0)} Items</span>
                        <span className="text-lg">₹ {totalAmount}</span>
                    </div>

                    <div className="text-center text-[10px] mb-6" style={{ color: '#9ca3af' }}>
                        Paid through CashApp UPI
                    </div>

                    <div className="pt-6 text-center" style={{ borderTop: '2px dashed #d1d5db' }}>
                        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: '#111827' }}>Thank You !</h1>
                    </div>
                    
                    <div className="mt-6" style={{ borderBottom: '2px dashed #d1d5db' }}></div>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;