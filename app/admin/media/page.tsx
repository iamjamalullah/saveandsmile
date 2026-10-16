'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Search,
  Trash2,
  Copy,
  ExternalLink,
  Eye,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Link as LinkIcon,
  HardDrive
} from 'lucide-react';

interface MediaItem {
  name: string;
  url: string;
  size: number;
  updatedAt: string;
}

export default function MediaLibraryPage() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [altText, setAltText] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlImport, setShowUrlImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/upload');
      const data = await res.json();
      if (data.success && Array.isArray(data.media)) {
        setMediaList(data.media);
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: 'Failed to load media assets: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Upload failed');
        }
      }

      setNotice({ type: 'success', message: `Successfully uploaded ${files.length} file(s) and converted to WebP!` });
      fetchMedia();
    } catch (err: any) {
      setNotice({ type: 'error', message: 'Upload error: ' + err.message });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const handleDelete = async (media: MediaItem) => {
    if (!confirm(`Are you sure you want to delete file "${media.name}"?`)) return;

    try {
      const res = await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: media.name })
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', message: 'File deleted successfully.' });
        if (selectedMedia?.name === media.name) setSelectedMedia(null);
        fetchMedia();
      } else {
        setNotice({ type: 'error', message: data.error || 'Could not delete file' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const copyToClipboard = (text: string, label = 'URL') => {
    navigator.clipboard.writeText(text);
    setNotice({ type: 'success', message: `${label} copied to clipboard!` });
    setTimeout(() => setNotice(null), 2500);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredMedia = useMemo(() => {
    if (!search.trim()) return mediaList;
    const q = search.toLowerCase();
    return mediaList.filter(m => m.name.toLowerCase().includes(q) || m.url.toLowerCase().includes(q));
  }, [mediaList, search]);

  const totalStorage = useMemo(() => {
    return mediaList.reduce((acc, m) => acc + (m.size || 0), 0);
  }, [mediaList]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-7 h-7 text-emerald-600" />
            Media Library & Assets
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload, optimize, and manage catalog product pictures, banner graphics, and icons.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchMedia}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
          >
            <Upload className={`w-4 h-4 ${uploading ? 'animate-bounce' : ''}`} />
            {uploading ? 'Uploading & Converting...' : 'Upload Images'}
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{notice.message}</span>
          <button onClick={() => setNotice(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search images by filename or URL path..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
          <span className="flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-emerald-600" />
            {mediaList.length} Total Files
          </span>
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-blue-600" />
            {formatFileSize(totalStorage)} Used
          </span>
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-sm">Scanning media assets...</p>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-gray-200">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900">No media assets found</h3>
          <p className="text-sm text-gray-500 mt-1">Upload pictures or drag & drop files here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredMedia.map(item => (
            <div
              key={item.name}
              onClick={() => {
                setSelectedMedia(item);
                setAltText(item.name.replace(/[-_]/g, ' ').replace(/\.[^/.]+$/, ''));
              }}
              className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-400 transition cursor-pointer flex flex-col justify-between"
            >
              <div className="aspect-square bg-gray-100 relative overflow-hidden flex items-center justify-center">
                <img
                  src={item.url}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <span className="p-2 bg-white/90 text-gray-800 rounded-full hover:bg-white transition">
                    <Eye className="w-4 h-4" />
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-white border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-800 truncate" title={item.name}>
                  {item.name}
                </p>
                <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                  <span>{formatFileSize(item.size)}</span>
                  <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Media Inspector Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <span className="text-sm font-bold text-gray-900 truncate max-w-md">{selectedMedia.name}</span>
              <button
                onClick={() => setSelectedMedia(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image Preview Box */}
              <div className="bg-gray-100 rounded-xl border border-gray-200 p-2 flex items-center justify-center overflow-hidden max-h-72">
                <img src={selectedMedia.url} alt={selectedMedia.name} className="max-w-full max-h-64 object-contain" />
              </div>

              {/* Details & Controls */}
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-gray-500 font-semibold uppercase block mb-1">File Name</span>
                  <p className="font-mono text-gray-900 break-all">{selectedMedia.name}</p>
                </div>

                <div>
                  <span className="text-gray-500 font-semibold uppercase block mb-1">File Size & Date</span>
                  <p className="text-gray-900">
                    {formatFileSize(selectedMedia.size)} • Uploaded {new Date(selectedMedia.updatedAt).toLocaleString()}
                  </p>
                </div>

                <div>
                  <span className="text-gray-500 font-semibold uppercase block mb-1">Public URL</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      readOnly
                      value={selectedMedia.url}
                      className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded font-mono text-[11px] text-gray-700"
                    />
                    <button
                      onClick={() => copyToClipboard(selectedMedia.url, 'Image URL')}
                      className="px-2.5 py-1.5 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 transition"
                      title="Copy URL"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-gray-500 font-semibold uppercase block mb-1">SEO Image Alt Text</span>
                  <input
                    type="text"
                    value={altText}
                    onChange={e => setAltText(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Useful for Google image search ranking and accessibility.</p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                  <button
                    onClick={() => handleDelete(selectedMedia)}
                    className="flex items-center gap-1.5 text-red-600 hover:text-red-700 font-semibold py-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Asset
                  </button>

                  <a
                    href={selectedMedia.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-semibold py-1.5"
                  >
                    Open Full Image
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
