import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { Upload, CheckCircle, Trash2, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { format } from 'date-fns';

export default function VerifyProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [serialNumber, setSerialNumber] = useState('');
  const [defects, setDefects] = useState('');
  const [imageBase64, setImageBase64] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProduct(data);
    } catch (error) {
      toast.error('获取产品信息失败');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleVerify = async () => {
    if (!serialNumber.trim()) {
      toast.error('请填写产品编号');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serial_number: serialNumber,
          defects,
          image_base64: imageBase64,
          status: 'archived'
        }),
      });

      if (!res.ok) throw new Error('Failed to verify');
      
      toast.success('验证通过并已归档');
      navigate('/archived');
    } catch (error) {
      toast.error('操作失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这条极差的记录吗？此操作不可恢复。')) return;
    
    try {
      setSaving(true);
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      
      toast.success('记录已删除');
      navigate('/');
    } catch (error) {
      toast.error('删除失败');
      setSaving(false);
    }
  };

  if (loading || !product) {
    return <div className="flex justify-center items-center h-64">加载中...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-stone-500 hover:text-stone-900 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        返回
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            待验证
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">{product.name}</h1>
        </div>
        <p className="text-stone-500">产品烧制完成后，请在此填写验证结果、缺点并上传照片进行归档。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Verification Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">产品编号 *</label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all font-mono"
                placeholder="例如：TC-2023-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">产品缺点 / 改进建议</label>
              <textarea
                value={defects}
                onChange={(e) => setDefects(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all resize-none"
                placeholder="记录烧制后发现的瑕疵，如：釉面不均、变形、色差等..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">最终产品照片</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  imageBase64 ? 'border-stone-300 bg-stone-50' : 'border-stone-300 hover:border-stone-500 hover:bg-stone-50'
                }`}
              >
                {imageBase64 ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                    <img src={imageBase64} alt="Preview" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-medium flex items-center gap-2">
                        <Upload size={20} /> 更换照片
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-stone-500">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-3">
                      <ImageIcon size={32} className="text-stone-400" />
                    </div>
                    <p className="font-medium text-stone-700 mb-1">点击上传照片</p>
                    <p className="text-sm">支持 JPG, PNG 格式，最大 5MB</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={handleDelete}
              disabled={saving}
              className="flex-1 flex justify-center items-center gap-2 px-6 py-4 rounded-xl font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <Trash2 size={20} />
              极差，直接删除记录
            </button>
            <button
              onClick={handleVerify}
              disabled={saving}
              className="flex-1 flex justify-center items-center gap-2 px-6 py-4 rounded-xl font-medium bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-md"
            >
              <CheckCircle size={20} />
              通过验证并归档
            </button>
          </div>
        </div>

        {/* Right Column: Original Specs Reference */}
        <div className="space-y-6">
          <div className="bg-stone-100 p-6 rounded-2xl border border-stone-200">
            <h3 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-stone-900 rounded-full"></span>
              研发参数回顾
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-xl border border-stone-200">
                  <p className="text-xs text-stone-500 mb-1">成型湿度</p>
                  <p className="font-mono font-medium">{product.humidity ? `${product.humidity}%` : '-'}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-stone-200">
                  <p className="text-xs text-stone-500 mb-1">窑炉温度</p>
                  <p className="font-mono font-medium">{product.kiln_temperature ? `${product.kiln_temperature}°C` : '-'}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-stone-200">
                  <p className="text-xs text-stone-500 mb-1">窑炉类型</p>
                  <p className="font-medium">{product.kiln_type || '-'}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-stone-200">
                  <p className="text-xs text-stone-500 mb-1">烧制日期</p>
                  <p className="font-medium">{product.firing_date ? format(new Date(product.firing_date), 'yyyy-MM-dd') : '-'}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-stone-200">
                  <p className="text-xs text-stone-500 mb-1">烧制时间</p>
                  <p className="font-mono font-medium">{product.firing_time ? `${product.firing_time} 分钟` : '-'}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200">
                <p className="text-xs text-stone-500 mb-3">原料配比</p>
                <div className="space-y-2">
                  {product.material_ratio.map((m, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-stone-700">{m.name}</span>
                      <span className="font-mono font-medium bg-stone-50 px-2 py-0.5 rounded text-stone-600">
                        {m.amount} {m.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {product.other_conditions && (
                <div className="bg-white p-4 rounded-xl border border-stone-200">
                  <p className="text-xs text-stone-500 mb-2">其他条件</p>
                  <p className="text-sm text-stone-700 whitespace-pre-wrap">{product.other_conditions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
