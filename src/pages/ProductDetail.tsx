import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { ArrowLeft, Thermometer, Droplets, Calendar, AlertTriangle, Timer, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

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
      navigate('/archived');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!printRef.current || !product) return;
    
    try {
      setDownloading(true);
      toast.loading('正在生成长图...', { id: 'download-toast' });
      
      const canvas = await html2canvas(printRef.current, {
        scale: 2, // Higher resolution
        useCORS: true,
        backgroundColor: '#f5f5f4', // Match the stone-50 background
        logging: false,
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `研发卡片_${product.name}_${product.serial_number || id}.png`;
      link.click();
      
      toast.success('长图已下载', { id: 'download-toast' });
    } catch (error) {
      console.error('Failed to generate image:', error);
      toast.error('生成长图失败', { id: 'download-toast' });
    } finally {
      setDownloading(false);
    }
  };

  if (loading || !product) {
    return <div className="flex justify-center items-center h-64">加载中...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto"
    >
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft size={20} />
          返回列表
        </button>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-50"
        >
          <Download size={18} />
          {downloading ? '生成中...' : '下载长图'}
        </button>
      </div>

      <div ref={printRef} className="bg-[#f5f5f4] p-4 -m-4 sm:p-0 sm:m-0 sm:bg-transparent">
        {/* Header */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              已归档
            </span>
            <span className="font-mono text-stone-500 bg-stone-100 px-3 py-1 rounded-md text-sm">
              #{product.serial_number}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">{product.name}</h1>
          {product.operator && (
            <p className="text-stone-500 mt-1">操作人 / 研发人: {product.operator}</p>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-2 text-sm text-stone-500">
          {product.firing_date && (
            <div className="flex items-center gap-2 bg-stone-50 px-4 py-2 rounded-xl">
              <Calendar size={16} />
              <span>烧制日期 {format(new Date(product.firing_date), 'yyyy年MM月dd日')}</span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-stone-50 px-4 py-2 rounded-xl">
            <Calendar size={16} />
            <span>归档于 {format(new Date(product.updated_at), 'yyyy年MM月dd日')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Image & Defects */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
            {product.image_url ? (
              <div className="aspect-[4/3] w-full bg-stone-100 relative">
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[4/3] w-full bg-stone-50 flex items-center justify-center text-stone-400">
                无产品照片
              </div>
            )}
          </div>

          {product.defects && (
            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
              <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                <AlertTriangle size={18} />
                缺点与改进建议
              </h3>
              <p className="text-amber-800 text-sm leading-relaxed whitespace-pre-wrap">
                {product.defects}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Technical Specs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Environment Specs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center text-stone-500 shrink-0">
                <Thermometer size={24} />
              </div>
              <div>
                <p className="text-sm text-stone-500 mb-1">窑炉类型</p>
                <p className="text-xl font-medium text-stone-900">
                  {product.kiln_type || '未记录'}
                </p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                <Droplets size={24} />
              </div>
              <div>
                <p className="text-sm text-stone-500 mb-1">成型湿度</p>
                <p className="text-xl font-mono font-medium text-stone-900">
                  {product.humidity ? `${product.humidity}%` : '未记录'}
                </p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                <Thermometer size={24} />
              </div>
              <div>
                <p className="text-sm text-stone-500 mb-1">窑炉温度</p>
                <p className="text-xl font-mono font-medium text-stone-900">
                  {product.kiln_temperature ? `${product.kiln_temperature}°C` : '未记录'}
                </p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                <Timer size={24} />
              </div>
              <div>
                <p className="text-sm text-stone-500 mb-1">烧制时间</p>
                <p className="text-xl font-mono font-medium text-stone-900">
                  {product.firing_time ? `${product.firing_time} 分钟` : '未记录'}
                </p>
              </div>
            </div>
          </div>

          {/* Material Ratio */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm">
            <h3 className="text-lg font-semibold text-stone-900 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-stone-900 rounded-full"></span>
              原料配比详情
            </h3>
            
            <div className="space-y-4">
              {product.material_ratio.map((m, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-1/3 font-medium text-stone-700">{m.name}</div>
                  <div className="w-2/3 flex items-center gap-4">
                    <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                      {m.unit === '%' && (
                        <div 
                          className="h-full bg-stone-800 rounded-full" 
                          style={{ width: `${Math.min(100, Number(m.amount))}%` }}
                        ></div>
                      )}
                    </div>
                    <div className="w-24 text-right font-mono font-medium text-stone-600">
                      {m.amount} {m.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Other Conditions */}
          {product.other_conditions && (
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm">
              <h3 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-stone-900 rounded-full"></span>
                其他条件与因素
              </h3>
              <div className="bg-stone-50 p-4 rounded-2xl text-stone-700 text-sm leading-relaxed whitespace-pre-wrap">
                {product.other_conditions}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </motion.div>
  );
}
