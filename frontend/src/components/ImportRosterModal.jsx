import { useState, useRef, useContext } from 'react';
import PropTypes from 'prop-types';
import { Modal, message } from 'antd';
import { ThemeContext } from '../context/ThemeContext';
import { downloadEntityTemplate, importEntitySpreadsheet } from '../services/superAdminAPI';

/**
 * QRollCall Enterprise Batch Ingestion Modal
 * Standard university roster importer with row-level validation feedback
 * Strictly complies with UI_DESIGN_RULES.md:
 * - rounded-lg modal surface, rounded-md controls (h-9 / h-8), shadow-none, 1px hairline border
 * - Template download link
 * - Direct ThemeContext bindings
 */
const ImportRosterModal = ({
  open,
  onClose,
  entity = 'students',
  title = 'Bulk Import Records',
  extraData = {},
  onSuccess
}) => {
  const { isDarkMode, getCardStyle, getSubtleStyle, getInputStyle } = useContext(ThemeContext);
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleReset = () => {
    setSelectedFile(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleModalClose = () => {
    handleReset();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      await downloadEntityTemplate(entity);
      message.success('Official spreadsheet template downloaded');
    } catch (err) {
      message.error('Failed to download template. Please try again.');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      message.warning('Please select a spreadsheet file (.xlsx or .csv)');
      return;
    }

    try {
      setImporting(true);
      const res = await importEntitySpreadsheet(entity, selectedFile, extraData);
      setImportResult(res);
      message.success(res.message || 'Batch processing completed');
      if (onSuccess) onSuccess();
    } catch (err) {
      message.error(err.response?.data?.message || 'Batch ingestion failed. Check spreadsheet format.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      title={title}
      open={open}
      onCancel={handleModalClose}
      footer={null}
      destroyOnClose
      width={600}
    >
      <div className="space-y-4 pt-2">
        {/* 1. Step 1: Download official template */}
        <div className="rounded-lg border p-3.5 space-y-2" style={getSubtleStyle()}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold block" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
                Step 1: Download official template
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">
                Use the verified university layout with pre-formatted column headers.
              </p>
            </div>
            <button
              type="button"
              disabled={downloadingTemplate}
              onClick={handleDownloadTemplate}
              className="h-8 px-3 rounded-md border text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-none transition-colors"
              style={getCardStyle()}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>{downloadingTemplate ? 'Downloading...' : 'Get .xlsx'}</span>
            </button>
          </div>
        </div>

        {/* 2. Step 2: Upload file */}
        <div className="space-y-2">
          <label className="text-xs font-semibold block" style={{ color: isDarkMode ? '#FFFFFF' : '#0F172A' }}>
            Step 2: Choose completed spreadsheet
          </label>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border-2 border-dashed p-6 text-center cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
            style={{
              borderColor: isDarkMode ? '#334155' : '#CBD5E1',
              backgroundColor: isDarkMode ? '#131926' : '#FFFFFF',
            }}
          >
            <svg className="w-8 h-8 mx-auto text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>

            {selectedFile ? (
              <div>
                <p className="text-xs font-semibold m-0 text-emerald-600 dark:text-emerald-400">
                  {selectedFile.name}
                </p>
                <span className="text-[11px] text-slate-500 font-mono">
                  {(selectedFile.size / 1024).toFixed(1)} KB · Click to change file
                </span>
              </div>
            ) : (
              <div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 m-0">
                  Click to select or drag and drop your spreadsheet
                </p>
                <span className="text-[11px] text-slate-400">
                  Supports Excel (.xlsx, .xls) and CSV (.csv) up to 10MB
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 3. Validation Summary & Row-level Errors */}
        {importResult && (
          <div className="rounded-lg border p-4 space-y-3" style={getSubtleStyle()}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Batch Ingestion Summary
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {importResult.successfulCount} / {importResult.totalRows} succeeded
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-md border" style={getCardStyle()}>
                <span className="text-[10px] text-slate-500 block uppercase">Total Processed</span>
                <span className="text-base font-bold tabular-nums">{importResult.totalRows || 0}</span>
              </div>
              <div className="p-2 rounded-md border" style={getCardStyle()}>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block uppercase font-semibold">Added</span>
                <span className="text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{importResult.successfulCount || 0}</span>
              </div>
              <div className="p-2 rounded-md border" style={getCardStyle()}>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 block uppercase font-semibold">Failed</span>
                <span className="text-base font-bold tabular-nums text-rose-600 dark:text-rose-400">{importResult.failedCount || 0}</span>
              </div>
            </div>

            {/* List Row Errors */}
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="space-y-1 mt-2">
                <span className="text-[11px] font-semibold text-rose-600 block">
                  Errors encountered ({importResult.errors.length}):
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1 border rounded-md p-2 text-[11px] font-mono text-rose-600 dark:text-rose-400" style={getSubtleStyle()}>
                  {importResult.errors.map((err, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="font-bold shrink-0">Row {err.row}:</span>
                      <span>{err.error || err.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }}>
          <button
            type="button"
            onClick={handleModalClose}
            className="h-9 px-4 rounded-md border text-xs font-semibold cursor-pointer"
            style={getSubtleStyle()}
          >
            {importResult ? 'Close' : 'Cancel'}
          </button>

          <button
            type="button"
            disabled={!selectedFile || importing}
            onClick={handleUpload}
            className="h-9 px-4 rounded-md text-xs font-semibold text-white bg-[#131926] dark:bg-[#D4FF5E] dark:text-[#131926] cursor-pointer disabled:opacity-50 transition-colors"
          >
            {importing ? 'Processing file...' : 'Upload and ingest'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

ImportRosterModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  entity: PropTypes.string,
  title: PropTypes.string,
  extraData: PropTypes.object,
  onSuccess: PropTypes.func
};

export default ImportRosterModal;
