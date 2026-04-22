// components/dataset/DatasetManager.tsx
import React, { useState, useEffect } from 'react';
import { getDatasetInfo, resetDataset, uploadDataset } from '../../api/endpoints';
import { Upload, RotateCcw } from 'lucide-react';

export const DatasetManager: React.FC = () => {
  const [datasetInfo, setDatasetInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDatasetInfo();
  }, []);

  const loadDatasetInfo = async () => {
    setLoading(true);
    try {
      const info = await getDatasetInfo();
      setDatasetInfo(info);
    } catch (error) {
      console.error('Error loading dataset info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Bạn có chắc muốn reset về dataset mẫu?')) {
      try {
        await resetDataset();
        await loadDatasetInfo();
      } catch (error) {
        console.error('Error resetting dataset:', error);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);

    const formData = new FormData(e.currentTarget);
    const nodesFile = formData.get('nodes_file') as File;
    const edgesFile = formData.get('edges_file') as File;

    if (!nodesFile || !edgesFile) {
      alert('Vui lòng chọn cả hai file');
      setUploading(false);
      return;
    }

    try {
      await uploadDataset(nodesFile, edgesFile);
      await loadDatasetInfo();
      e.currentTarget.reset();
    } catch (error) {
      console.error('Error uploading dataset:', error);
      alert('Lỗi tải lên dataset');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Current Dataset Info */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Thông Tin Dataset Hiện Tại</h3>
        
        {loading ? (
          <div className="text-slate-400">Đang tải...</div>
        ) : datasetInfo ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Số Người Dùng</p>
              <p className="text-3xl font-bold text-blue-400">{datasetInfo.num_nodes}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Số Kết Nối</p>
              <p className="text-3xl font-bold text-green-400">{datasetInfo.num_edges}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Mật Độ</p>
              <p className="text-3xl font-bold text-purple-400">{datasetInfo.density?.toFixed(3)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Độ Trung Bình</p>
              <p className="text-3xl font-bold text-orange-400">{datasetInfo.avg_degree?.toFixed(2)}</p>
            </div>
          </div>
        ) : null}

        <button
          onClick={handleReset}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded transition-colors"
        >
          <RotateCcw size={18} />
          Reset Về Dataset Mẫu
        </button>
      </div>

      {/* Upload New Dataset */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Tải Lên Dataset Mới</h3>
        
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">File Nodes (CSV)</label>
              <input
                type="file"
                name="nodes_file"
                accept=".csv"
                required
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
              <p className="text-xs text-slate-400 mt-2">Format: id,name,username</p>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">File Edges (CSV)</label>
              <input
                type="file"
                name="edges_file"
                accept=".csv"
                required
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
              <p className="text-xs text-slate-400 mt-2">Format: source,target</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium rounded transition-colors"
          >
            <Upload size={18} />
            {uploading ? 'Đang Tải...' : 'Tải Lên'}
          </button>
        </form>
      </div>

      {/* Instructions */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Hướng Dẫn</h3>
        <div className="space-y-3 text-slate-400 text-sm">
          <div>
            <p className="font-medium text-white mb-1">File Nodes CSV:</p>
            <p>Phải có 3 cột: id, name, username</p>
            <code className="block bg-slate-700 p-2 rounded mt-1 text-xs">0,Nguyễn Văn A,nguyenvana</code>
          </div>
          <div>
            <p className="font-medium text-white mb-1">File Edges CSV:</p>
            <p>Phải có 2 cột: source, target</p>
            <code className="block bg-slate-700 p-2 rounded mt-1 text-xs">0,1</code>
          </div>
        </div>
      </div>
    </div>
  );
};
