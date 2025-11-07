// src/components/LoadingScreen.tsx
import React, { useState, useEffect } from 'react';

const tips = [
    "Kanalları düzenlemek için sunucu sahibi olmalısın.",
    "Arkadaşlarınıza sunucu daveti gönderebilirsiniz.",
    "Ses ve görüntü ayarlarınızı profilinizden yapabilirsiniz.",
    "'Rahatsız Etmeyin' durumu size bildirim gelmesini engeller.",
    "Her kullanıcının sadece bir sunucusu olabilir."
];

const LoadingScreen: React.FC = () => {
    const [tip, setTip] = useState(tips[Math.floor(Math.random() * tips.length)]);

     useEffect(() => {
        const interval = setInterval(() => {
            setTip(tips[Math.floor(Math.random() * tips.length)]);
        }, 5000); // Change tip every 5 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white select-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-700 via-slate-900 to-black">
            <img src="https://gateway.pinata.cloud/ipfs/bafkreignl7hino45ssmnnjwtxcmsamf43ikxwnyjm2zcamuxvk4ujihz6q" alt="Serçe Logo" className="w-32 h-32 rounded-full animate-pulse-grow" />
            <h1 className="text-3xl font-bold text-white mt-8 tracking-wider">SERÇE Yükleniyor...</h1>
            <p className="text-slate-400 mt-4 max-w-xs text-center transition-opacity duration-500">{tip}</p>
        </div>
    );
};

export default LoadingScreen;
