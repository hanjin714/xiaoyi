import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { MaterialRatio } from '../types';

export default function CreateProduct() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState('');
  const [humidity, setHumidity] = useState('');
  const [kilnTemperature, setKilnTemperature] = useState('');
  const [kilnType, setKilnType] = useState('电窑');
  const [firingDate, setFiringDate] = useState(new Date().toISOString().split('T')[0]);
  const [firingTime, setFiringTime] = useState('');
  const [operator, setOperator] = useState('');
  const [otherConditions, setOtherConditions] = useState('');
  const [materials, setMaterials] = useState<MaterialRatio[]>([
    { name: '', amount: '', unit: '%' }
  ]);

  const handleAddMaterial = () => {
    setMaterials([...materials, { name: '', amount: '', unit: '%' }]);
  };

  const handleRemoveMaterial = (index: number) => {
    if (materials.length > 1) {
      setMaterials(materials.filter((_, i) => i !== index));
    }
  };

  const handleMaterialChange = (index: number, field: keyof MaterialRatio, value: string | number) => {
    const newMaterials = [...materials];
    newMaterials[index] = { ...newMaterials[index], [field]: value };
    setMaterials(newMaterials);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('请输入产品名称');
      return;
    }

    const validMaterials = materials.filter(m => m.name.trim() !== '' && m.amount !== '' && Number(m.amount) > 0);
    if (validMaterials.length === 0) {
      toast.error('请至少添加一种有效原料配比');
      return;
    }

    const percentageMaterials = validMaterials.filter(m => m.unit === '%');
    const totalPercentage = percentageMaterials.reduce((sum, m) => sum + Number(m.amount), 0);
    if (percentageMaterials.length > 0 && Math.abs(totalPercentage - 100) > 0.1) {
      toast.error(`当前百分比原料总计为 ${totalPercentage}%，建议调整至 100%`);
    }

    try {
      setLoading(true);
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          humidity: humidity ? Number(humidity) : null,
          kiln_temperature: kilnTemperature ? Number(kilnTemperature) : null,
          kiln_type: kilnType,
          firing_date: firingDate,
          firing_time: firingTime ? Number(firingTime) : null,
          operator: operator,
          other_conditions: otherConditions,
          material_ratio: validMaterials
        }),
      });

      if (!res.ok) throw new Error('Failed to create');
      
      toast.success('研发卡片已生成，进入待验证状态');
      navigate('/');
    } catch (error) {
      toast.error('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">新建研发卡片</h1>
        <p className="text-stone-500 mt-1">记录新产品的原料配比与烧制条件，生成待验证卡片。</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-stone-900">基本信息</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">研发产品名称 *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                placeholder="例如：高白玉瓷系列A"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">烧制日期</label>
                <input
                  type="date"
                  value={firingDate}
                  onChange={(e) => setFiringDate(e.target.value)}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">操作人 / 研发人</label>
                <input
                  type="text"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                  placeholder="例如：张三"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">窑炉类型</label>
                <select
                  value={kilnType}
                  onChange={(e) => setKilnType(e.target.value)}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                >
                  <option value="电窑">电窑</option>
                  <option value="气窑">气窑</option>
                  <option value="柴窑">柴窑</option>
                  <option value="乐烧">乐烧</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">成型湿度 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={humidity}
                  onChange={(e) => setHumidity(e.target.value)}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                  placeholder="例如：18.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">窑炉温度设定 (°C)</label>
                <input
                  type="number"
                  step="1"
                  value={kilnTemperature}
                  onChange={(e) => setKilnTemperature(e.target.value)}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                  placeholder="例如：1320"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">烧制时间 (分钟)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={firingTime}
                  onChange={(e) => setFiringTime(e.target.value)}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                  placeholder="例如：120"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Material Ratios */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-stone-900">原料配比</h2>
            <button
              type="button"
              onClick={handleAddMaterial}
              className="text-sm flex items-center gap-1 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={16} />
              添加原料
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-1 mb-2">
              <div className="sm:col-span-7 text-xs font-medium text-stone-500 uppercase tracking-wider">原料名称</div>
              <div className="sm:col-span-4 text-xs font-medium text-stone-500 uppercase tracking-wider">用量与单位</div>
              <div className="sm:col-span-1"></div>
            </div>
            {materials.map((material, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center group bg-stone-50/50 sm:bg-transparent p-4 sm:p-0 rounded-2xl sm:rounded-none border border-stone-100 sm:border-none">
                <div className="sm:col-span-7">
                  <label className="block sm:hidden text-xs font-medium text-stone-500 mb-1.5">原料名称</label>
                  <input
                    type="text"
                    value={material.name}
                    onChange={(e) => handleMaterialChange(index, 'name', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white sm:bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                    placeholder="例如: 高岭土、石英..."
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block sm:hidden text-xs font-medium text-stone-500 mb-1.5">用量与单位</label>
                  <div className="flex shadow-sm rounded-xl">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={material.amount}
                      onChange={(e) => handleMaterialChange(index, 'amount', e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-white sm:bg-stone-50 border border-stone-200 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                      placeholder="数量"
                    />
                    <select
                      value={material.unit}
                      onChange={(e) => handleMaterialChange(index, 'unit', e.target.value)}
                      className="w-24 px-2 py-2.5 bg-stone-100 border border-l-0 border-stone-200 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all text-stone-700 font-medium"
                    >
                      <option value="%">%</option>
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="份">份</option>
                    </select>
                  </div>
                </div>
                <div className="sm:col-span-1 flex justify-end sm:justify-center mt-2 sm:mt-0">
                  <button
                    type="button"
                    onClick={() => handleRemoveMaterial(index)}
                    disabled={materials.length === 1}
                    className="p-2.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-stone-400 transition-all"
                    title="删除此原料"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between text-sm">
            <span className="text-stone-500">百分比原料总计</span>
            <span className={`font-mono font-medium ${
              materials.filter(m => m.unit === '%').reduce((sum, m) => sum + Number(m.amount), 0) === 100 
                ? 'text-emerald-600' 
                : 'text-amber-600'
            }`}>
              {materials.filter(m => m.unit === '%').reduce((sum, m) => sum + Number(m.amount), 0).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Other Conditions */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-stone-900">其他条件与因素</h2>
          <textarea
            value={otherConditions}
            onChange={(e) => setOtherConditions(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all resize-none"
            placeholder="记录其他可能影响烧制结果的因素，如：环境湿度、特殊工艺说明等..."
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-xl font-medium text-stone-600 hover:bg-stone-100 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 rounded-xl font-medium bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-70 transition-colors shadow-md"
          >
            {loading ? '保存中...' : (
              <>
                <Save size={20} />
                生成待验证卡片
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
