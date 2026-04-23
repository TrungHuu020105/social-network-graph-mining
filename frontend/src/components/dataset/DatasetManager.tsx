import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Cpu, Database, FileJson, FileText, Network, RotateCcw, Upload } from 'lucide-react';
import { getDatasetInfo, resetDataset, uploadFullMLDataset } from '../../api/endpoints';
import { DatasetInfo } from '../../types';

export const DatasetManager: React.FC = () => {
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingML, setUploadingML] = useState(false);

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
    if (window.confirm('Ban co chac muon reset ve dataset mac dinh?')) {
      try {
        await resetDataset();
        await loadDatasetInfo();
      } catch (error) {
        console.error('Error resetting dataset:', error);
      }
    }
  };

  const handleUploadML = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadingML(true);
    const form = e.currentTarget;

    const formData = new FormData(form);
    const edgesFile = formData.get('ml_edges_file') as File;
    const featuresFile = formData.get('ml_features_file') as File;
    const targetFile = formData.get('ml_target_file') as File;

    if (!edgesFile || !featuresFile || !targetFile) {
      alert('Vui long chon du 3 file: edges + features + target');
      setUploadingML(false);
      return;
    }

    try {
      await uploadFullMLDataset(edgesFile, featuresFile, targetFile);
      await loadDatasetInfo();
      form.reset();
      alert('Upload full ML dataset thanh cong');
    } catch (error: any) {
      console.error('Error uploading full ML dataset:', error);
      const detail = error?.response?.data?.detail;
      const status = error?.response?.status;
      const fallback = error?.message || 'Unknown error';
      const reason = detail || fallback;
      alert(`Upload that bai${status ? ` (HTTP ${status})` : ''}: ${reason}`);
    } finally {
      setUploadingML(false);
    }
  };

  const class0 = datasetInfo?.label_distribution?.['0'] ?? 0;
  const class1 = datasetInfo?.label_distribution?.['1'] ?? 0;

  const foundFiles = useMemo(() => {
    if (!datasetInfo?.files) return [];
    return Object.entries(datasetInfo.files).filter(([, file]) => file.exists);
  }, [datasetInfo]);

  const modeText = useMemo(() => {
    if (!datasetInfo) return '-';
    if (datasetInfo.dataset_mode === 'twitch_ml') return 'Twitch/PTBR ML dataset';
    return 'Simple graph dataset';
  }, [datasetInfo]);

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-white">Trang Thai Du Lieu</h3>
            <p className="mt-1 text-sm text-slate-400">Thong tin dataset hien tai va kha nang train GCN du doan partner.</p>
          </div>
          {datasetInfo?.gcn_ready ? (
            <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-emerald-300">
              <CheckCircle2 size={16} />
              GCN Ready
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-300">
              <AlertTriangle size={16} />
              GCN Limited
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-slate-400">Dang tai...</div>
        ) : datasetInfo ? (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <div className="rounded-lg bg-slate-700 p-3">
                <p className="text-xs text-slate-400">Nodes</p>
                <p className="text-2xl font-bold text-blue-400">{datasetInfo.num_nodes}</p>
              </div>
              <div className="rounded-lg bg-slate-700 p-3">
                <p className="text-xs text-slate-400">Edges</p>
                <p className="text-2xl font-bold text-emerald-400">{datasetInfo.num_edges}</p>
              </div>
              <div className="rounded-lg bg-slate-700 p-3">
                <p className="text-xs text-slate-400">Density</p>
                <p className="text-2xl font-bold text-violet-400">{datasetInfo.density?.toFixed(3)}</p>
              </div>
              <div className="rounded-lg bg-slate-700 p-3">
                <p className="text-xs text-slate-400">Avg degree</p>
                <p className="text-2xl font-bold text-orange-400">{datasetInfo.avg_degree?.toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-slate-700 p-3">
                <p className="text-xs text-slate-400">Feature dim</p>
                <p className="text-2xl font-bold text-cyan-400">{datasetInfo.feature_dim ?? 0}</p>
              </div>
              <div className="rounded-lg bg-slate-700 p-3">
                <p className="text-xs text-slate-400">Labeled nodes</p>
                <p className="text-2xl font-bold text-pink-400">{datasetInfo.labeled_nodes ?? 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
                <div className="mb-3 flex items-center gap-2 text-slate-100">
                  <Database size={16} />
                  <span className="font-semibold">Dataset mode</span>
                </div>
                <p className="text-sm text-slate-300">{modeText}</p>
                <p className="mt-2 text-xs text-slate-400">
                  Label hien tai cho GCN classification: <span className="font-semibold text-slate-200">{datasetInfo.label_name ?? 'partner'}</span>
                </p>
              </div>

              <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
                <div className="mb-3 flex items-center gap-2 text-slate-100">
                  <Cpu size={16} />
                  <span className="font-semibold">Label distribution</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md bg-slate-700/70 p-3">
                    <p className="text-xs text-slate-400">Non-Partner (0)</p>
                    <p className="text-xl font-bold text-blue-300">{class0}</p>
                  </div>
                  <div className="rounded-md bg-slate-700/70 p-3">
                    <p className="text-xs text-slate-400">Partner (1)</p>
                    <p className="text-xl font-bold text-red-300">{class1}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-slate-400">Khong co du lieu.</div>
        )}

        <button
          onClick={handleReset}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
        >
          <RotateCcw size={18} />
          Reset ve dataset mac dinh
        </button>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        <h3 className="mb-4 text-xl font-bold text-white">File Availability</h3>
        {datasetInfo?.files ? (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {foundFiles.map(([key]) => (
              <div key={key} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2">
                <div className="flex items-center gap-2 text-slate-300">
                  {key.includes('features') ? <FileJson size={16} /> : <FileText size={16} />}
                  <span className="text-sm">{key}</span>
                </div>
                <span className="text-xs font-semibold text-emerald-300">FOUND</span>
              </div>
            ))}
            {foundFiles.length === 0 && <p className="text-sm text-slate-400">Khong tim thay file nao trong data directory.</p>}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Khong lay duoc thong tin file.</p>
        )}
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        <h3 className="mb-2 text-xl font-bold text-white">Upload Dataset Theo Cau Truc File Hien Tai</h3>
        <p className="mb-4 text-sm text-slate-400">Upload dung 3 file: edges + features + target (partner).</p>

        <form onSubmit={handleUploadML} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Edges CSV</label>
              <input
                type="file"
                name="ml_edges_file"
                accept=".csv"
                required
                className="w-full rounded border border-slate-600 bg-slate-700 px-4 py-2 text-white file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
              />
              <p className="mt-2 text-xs text-slate-400">Header: source,target (hoac from,to)</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Features JSON</label>
              <input
                type="file"
                name="ml_features_file"
                accept=".json"
                required
                className="w-full rounded border border-slate-600 bg-slate-700 px-4 py-2 text-white file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
              />
              <p className="mt-2 text-xs text-slate-400">Format: {"{\"node_id\": [feature_index, ...], ...}"}</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Target CSV</label>
              <input
                type="file"
                name="ml_target_file"
                accept=".csv"
                required
                className="w-full rounded border border-slate-600 bg-slate-700 px-4 py-2 text-white file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
              />
              <p className="mt-2 text-xs text-slate-400">Hop le voi format cu: id,days,mature,views,partner,new_id (he thong dung new_id + partner)</p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4 text-xs text-slate-300">
            <p className="mb-2 font-semibold text-slate-100">Huong dan ngan gon:</p>
            <ul className="space-y-1">
              <li>1. Upload du 3 file: Edges CSV + Features JSON + Target CSV.</li>
              <li>2. Node ID phai dong bo giua 3 file.</li>
              <li>3. Target hop le voi bo cot day du: `id,days,mature,views,partner,new_id`.</li>
              <li>4. Khi train GCN hien tai, he thong doc `new_id` lam node id va `partner` lam nhan.</li>
            </ul>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <p className="mb-1 text-slate-400">Vi du Edges CSV</p>
                <pre className="overflow-x-auto rounded bg-slate-950/60 p-2 text-[11px]">source,target{"\n"}126,504{"\n"}126,1297</pre>
              </div>
              <div>
                <p className="mb-1 text-slate-400">Vi du Features JSON</p>
                <pre className="overflow-x-auto rounded bg-slate-950/60 p-2 text-[11px]">{"{\n  \"126\": [0, 3, 7],\n  \"504\": [1, 8]\n}"}</pre>
              </div>
              <div>
                <p className="mb-1 text-slate-400">Vi du Target CSV</p>
                <pre className="overflow-x-auto rounded bg-slate-950/60 p-2 text-[11px]">id,days,mature,views,partner,new_id{"\n"}75634699,1629,True,573,False,126{"\n"}13348417,715,False,1375,True,504</pre>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={uploadingML}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 font-medium text-white transition-colors hover:bg-emerald-700 disabled:bg-slate-600"
          >
            <Upload size={18} />
            {uploadingML ? 'Dang upload...' : 'Upload 3 File Dataset'}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-white">
          <Network size={18} />
          Huong dan nhanh
        </h3>
        <ul className="space-y-1 text-sm text-slate-400">
          <li>- Cau truc khuyen nghi: PTBR_edges.csv + PTBR_features.json + PTBR_target.csv.</li>
          <li>- Nhan "Reset ve dataset mac dinh" de quay lai bo du lieu chuan cua do an.</li>
          <li>- Sau khi upload, vao trang GCN va train lai de cap nhat ket qua du doan.</li>
        </ul>
      </section>
    </div>
  );
};
