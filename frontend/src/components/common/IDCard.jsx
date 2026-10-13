import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { GraduationCap, Phone, Mail, MapPin, RotateCw } from 'lucide-react';

const IDCard = ({ user, scale = 1, isPrint = false, forceSide = null }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  if (!user) return null;

  const formatDate = (dateVal) => {
    if (!dateVal) return '30-05-2008';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return String(dateVal);
    }
  };

  const verifyUrl = `${window.location.origin}/verify-id/${user.verificationId || 'demo'}`;

  // Card Front Content Component
  const CardFront = () => (
    <div className="w-[320px] h-[520px] bg-white rounded-[24px] shadow-2xl overflow-hidden relative border border-slate-200 flex flex-col justify-between font-sans select-none">
      {/* Top Red Vector Pattern Header */}
      <div className="relative h-[115px] bg-white flex flex-col items-center justify-center pt-3">
        {/* Red Curve Shapes */}
        <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-r from-red-600 via-rose-600 to-red-700"></div>
        <div className="absolute top-6 left-0 right-0 h-6 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 rounded-b-[100%] transform scale-x-125 shadow-xs"></div>
        <div className="absolute top-2 right-4 w-12 h-12 rounded-full border-4 border-red-500/20"></div>

        {/* Logo & School Name */}
        <div className="z-10 flex flex-col items-center mt-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-md mb-1">
            <GraduationCap className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h1 className="text-xs font-black uppercase tracking-wider text-slate-800 leading-tight">
            {user.schoolName || 'STUDYMATE SCHOOL'}
          </h1>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
            SCHOOL MANAGEMENT SYSTEM
          </p>
        </div>
      </div>

      {/* Profile Photo Frame */}
      <div className="flex flex-col items-center justify-center -mt-2 z-10 px-4">
        <div className="w-28 h-28 rounded-2xl p-1 bg-gradient-to-b from-red-500 via-rose-400 to-red-600 shadow-lg">
          <div className="w-full h-full rounded-[14px] bg-white overflow-hidden border-2 border-white flex items-center justify-center">
            {user.profilePic ? (
              <img
                src={user.profilePic}
                alt={user.name}
                crossOrigin="anonymous"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 text-slate-600 font-black text-4xl flex items-center justify-center">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Name & Role Subtitle */}
        <h2 className="text-lg font-black text-slate-900 tracking-tight mt-2 text-center leading-tight">
          {user.name}
        </h2>
        <p className="text-[11px] font-bold text-red-600 uppercase tracking-widest mt-0.5">
          {user.role === 'student' ? 'Student' : user.designation || user.role}
        </p>
      </div>

      {/* Bottom Dark Navy Details Card Section */}
      <div className="relative mt-2 bg-[#0F172A] text-white pt-4 pb-5 px-5 flex-1 flex flex-col justify-center border-t-2 border-red-600">
        {/* Decorative Top Accent Curve */}
        <div className="absolute -top-3 left-0 right-0 h-3 bg-[#0F172A] rounded-t-[100%] border-t-2 border-red-500"></div>

        <div className="space-y-1.5 text-[11px] font-medium z-10">
          <div className="grid grid-cols-[100px_1fr] items-baseline border-b border-slate-700/50 pb-1">
            <span className="text-slate-400 uppercase font-bold tracking-wider text-[10px]">
              {user.role === 'student' ? 'ID No' : 'Employee ID'}
            </span>
            <span className="font-bold text-white font-mono">
              : {user.studentId || user.employeeId || '12345678'}
            </span>
          </div>

          <div className="grid grid-cols-[100px_1fr] items-baseline border-b border-slate-700/50 pb-1">
            <span className="text-slate-400 uppercase font-bold tracking-wider text-[10px]">
              {user.role === 'student' ? 'Class' : 'Designation'}
            </span>
            <span className="font-bold text-white truncate">
              : {user.className || user.designation || '10-A'}
            </span>
          </div>

          <div className="grid grid-cols-[100px_1fr] items-baseline border-b border-slate-700/50 pb-1">
            <span className="text-slate-400 uppercase font-bold tracking-wider text-[10px]">
              Date of Birth
            </span>
            <span className="font-bold text-white">
              : {formatDate(user.dateOfBirth)}
            </span>
          </div>

          <div className="grid grid-cols-[100px_1fr] items-baseline border-b border-slate-700/50 pb-1">
            <span className="text-slate-400 uppercase font-bold tracking-wider text-[10px]">
              Blood Group
            </span>
            <span className="font-extrabold text-red-400">
              : {user.bloodGroup || 'A+'}
            </span>
          </div>

          {user.role === 'student' && (
            <>
              <div className="grid grid-cols-[100px_1fr] items-baseline border-b border-slate-700/50 pb-1">
                <span className="text-slate-400 uppercase font-bold tracking-wider text-[10px]">
                  Parent Name
                </span>
                <span className="font-bold text-white truncate">
                  : {user.parentName || 'Parent Name'}
                </span>
              </div>

              <div className="grid grid-cols-[100px_1fr] items-baseline">
                <span className="text-slate-400 uppercase font-bold tracking-wider text-[10px]">
                  Parent Contact
                </span>
                <span className="font-bold text-white font-mono truncate">
                  : {user.parentPhone || user.phone || '+91 9876543210'}
                </span>
              </div>
            </>
          )}

          {user.role !== 'student' && (
            <div className="grid grid-cols-[100px_1fr] items-baseline">
              <span className="text-slate-400 uppercase font-bold tracking-wider text-[10px]">
                Contact No
              </span>
              <span className="font-bold text-white font-mono truncate">
                : {user.phone || '+91 9876543210'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Card Back Content Component
  const CardBack = () => (
    <div className="w-[320px] h-[520px] bg-white rounded-[24px] shadow-2xl overflow-hidden relative border border-slate-200 flex flex-col justify-between font-sans select-none">
      {/* Top Header Section */}
      <div className="bg-[#0F172A] text-white p-4 relative border-b-4 border-red-600">
        <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 rounded-full blur-xl pointer-events-none"></div>
        <h3 className="text-xs font-black uppercase tracking-wider text-red-500 mb-1">
          TERMS AND CONDITIONS
        </h3>
        <ul className="text-[9px] text-slate-300 space-y-0.5 leading-tight font-medium">
          <li>• This card must be carried at all times on campus.</li>
          <li>• Lost cards should be reported to school office.</li>
          <li>• Non-transferable property of the institution.</li>
        </ul>
      </div>

      {/* Center QR Code Scanner */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50/50">
        <div className="p-2.5 bg-white border-2 border-red-500/30 rounded-2xl shadow-md flex flex-col items-center relative group">
          <QRCodeSVG value={verifyUrl} size={110} level="M" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">
          SCANNER VERIFICATION
        </span>
        <p className="text-[8px] text-slate-400 font-semibold mt-0.5">
          Scan QR code to verify student identity online
        </p>

        {/* Contact Info Pills */}
        <div className="w-full mt-4 space-y-1.5 px-2">
          <div className="flex items-center gap-2 text-[10px] text-slate-700 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="w-5 h-5 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
              <Phone className="w-3 h-3 stroke-[2.5]" />
            </div>
            <span className="font-semibold truncate">
              {user.parentPhone || user.phone || '+91 98765 43210'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-700 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="w-5 h-5 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
              <Mail className="w-3 h-3 stroke-[2.5]" />
            </div>
            <span className="font-semibold truncate">
              {user.email || 'info@studymate.edu'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-700 bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="w-5 h-5 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-3 h-3 stroke-[2.5]" />
            </div>
            <span className="font-semibold truncate">
              {user.address || 'Street name, City, Country'}
            </span>
          </div>
        </div>
      </div>

      {/* Signature & Bottom Logo Footer */}
      <div className="p-4 bg-white border-t border-slate-100 flex flex-col items-center">
        {/* Principal Signature */}
        <div className="text-center mb-2">
          <div className="font-serif italic font-extrabold text-slate-800 text-sm tracking-wide border-b border-slate-300 px-4 pb-0.5">
            Principal Signature
          </div>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
            AUTHORIZED SIGNATURE
          </span>
        </div>

        {/* Bottom Logo */}
        <div className="flex items-center gap-1.5 pt-1">
          <div className="w-5 h-5 rounded-md bg-red-600 text-white flex items-center justify-center">
            <GraduationCap className="w-3 h-3 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-black tracking-wider uppercase text-slate-800">
            {user.schoolName || 'STUDYMATE SCHOOL'}
          </span>
        </div>
      </div>
    </div>
  );

  // If in Print/PDF Mode, render BOTH front and back side-by-side!
  if (isPrint) {
    return (
      <div className="flex flex-col sm:flex-row gap-6 items-center justify-center p-4 bg-slate-100/50 rounded-2xl">
        <div className="transform transition hover:scale-[1.02]">
          <CardFront />
        </div>
        <div className="transform transition hover:scale-[1.02]">
          <CardBack />
        </div>
      </div>
    );
  }

  // If a specific side is forced
  if (forceSide === 'front') return <CardFront />;
  if (forceSide === 'back') return <CardBack />;

  // Default Interactive 2D Flip Card mode
  return (
    <div className="flex flex-col items-center space-y-4">
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="relative cursor-pointer group"
        style={{ perspective: '1000px', width: '320px', height: '520px' }}
      >
        {/* Flip Card Wrapper */}
        <div
          className="w-full h-full transition-transform duration-700 ease-in-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front Face */}
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <CardFront />
          </div>

          {/* Back Face */}
          <div
            className="absolute inset-0"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <CardBack />
          </div>
        </div>
      </div>

      {/* Tap / Click hint */}
      <button
        onClick={() => setIsFlipped(!isFlipped)}
        className="inline-flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-full transition shadow-xs"
      >
        <RotateCw className="w-3.5 h-3.5" />
        {isFlipped ? 'Tap to view Front details' : 'Tap card to flip Back & Scan QR'}
      </button>
    </div>
  );
};

export default IDCard;
