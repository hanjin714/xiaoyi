import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { format } from 'date-fns';
import { Clock, CheckCircle2, ChevronRight, Thermometer, Droplets, Trash2, Timer } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';

export default function Dashboard({ status = 'pending' }: { status?: 'pending' | 'archived' }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [status]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products?status=${status}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      toast.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('确定要删除这条记录吗？')) return;
    
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('删除成功');
      fetchProducts();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">加载中...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            {status === 'pending' ? '待验证产品' : '已归档产品'}
          </h1>
          <p className="text-stone-500 mt-1 text-sm">
            {status === 'pending' ? '需要进行烧制后验证并记录结果' : '已成功验证并归档的研发记录'}
          </p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-stone-100 mb-4">
            {status === 'pending' ? <Clock className="text-stone-400" size={32} /> : <CheckCircle2 className="text-stone-400" size={32} />}
          </div>
          <h3 className="text-lg font-medium text-stone-900 mb-1">暂无数据</h3>
          <p className="text-stone-500">
            {status === 'pending' ? '目前没有待验证的研发记录' : '目前没有已归档的研发记录'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div 
              key={product.id} 
              onClick={() => navigate(status === 'pending' ? `/verify/${product.id}` : `/product/${product.id}`)}
              className="group bg-white border border-stone-200 rounded-2xl p-5 hover:shadow-lg hover:border-stone-300 transition-all duration-200 flex flex-col h-full cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {status === 'pending' ? '待验证' : '已归档'}
                    </span>
                    {product.serial_number && (
                      <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                        #{product.serial_number}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-stone-900 group-hover:text-stone-700 transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                </div>
                {status === 'pending' && (
                  <button 
                    onClick={(e) => handleDelete(product.id, e)}
                    className="text-stone-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                    title="删除记录"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              {product.image_url && status === 'archived' && (
                <div className="mb-4 rounded-xl overflow-hidden h-32 bg-stone-100">
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex-1">
                <div className="flex gap-4 mb-4 text-sm text-stone-600">
                  {product.kiln_temperature && (
                    <div className="flex items-center gap-1">
                      <Thermometer size={16} className="text-stone-400" />
                      <span>{product.kiln_temperature}°C</span>
                    </div>
                  )}
                  {product.firing_date && (
                    <div className="flex items-center gap-1">
                      <Clock size={16} className="text-stone-400" />
                      <span>{format(new Date(product.firing_date), 'MM-dd')}</span>
                    </div>
                  )}
                  {product.firing_time && (
                    <div className="flex items-center gap-1">
                      <Timer size={16} className="text-stone-400" />
                      <span>{product.firing_time}m</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1 mb-4">
                  <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">主要原料</p>
                  <div className="flex flex-wrap gap-1">
                    {product.material_ratio.slice(0, 3).map((m, i) => (
                      <span key={i} className="text-xs bg-stone-100 text-stone-700 px-2 py-1 rounded-md">
                        {m.name} {m.amount}{m.unit}
                      </span>
                    ))}
                    {product.material_ratio.length > 3 && (
                      <span className="text-xs bg-stone-50 text-stone-500 px-2 py-1 rounded-md">
                        +{product.material_ratio.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex justify-between items-center mt-auto">
                <span className="text-xs text-stone-400">
                  {format(new Date(product.created_at), 'yyyy-MM-dd HH:mm')}
                </span>
                <div className="flex items-center text-sm font-medium text-stone-900 group-hover:translate-x-1 transition-transform">
                  {status === 'pending' ? '去验证' : '查看详情'}
                  <ChevronRight size={16} className="ml-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
