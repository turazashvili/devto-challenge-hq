'use client';

import * as React from 'react';
import { Dialog } from '@progress/kendo-react-dialogs';
import { Input, TextArea } from '@progress/kendo-react-inputs';
import { Button } from '@progress/kendo-react-buttons';
import { DropDownList } from '@progress/kendo-react-dropdowns';
import { useAISettings } from '../hooks/useAISettings';

interface AISettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AISettingsDialog({ isOpen, onClose }: AISettingsDialogProps) {
  const { settings, models, isLoadingModels, updateSettings, refreshModels } = useAISettings();
  const [formData, setFormData] = React.useState(settings);

  // Update form when settings change
  React.useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSave = () => {
    updateSettings(formData);
    onClose();
  };

  const handleInputChange = (field: keyof typeof formData) => (e: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target?.value || e.value || ''
    }));
  };

  const handleModelChange = (e: any) => {
    const modelId = e.value?.id || e.value || '';
    setFormData(prev => ({
      ...prev,
      selectedModel: modelId
    }));
  };

  const selectedModel = models.find(m => m.id === formData.selectedModel);

  if (!isOpen) return null;

  return (
    <Dialog
      title="AI Settings"
      onClose={onClose}
      width={500}
      height={600}
      modal={false}
    >
      <div className="p-4 space-y-4">
        {/* API Key */}
        <div>
          <label className="block text-sm font-medium mb-1">
            OpenRouter API Key *
          </label>
          <Input
            type="password"
            value={formData.apiKey}
            onChange={handleInputChange('apiKey')}
            placeholder="sk-or-v1-..."
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Get your API key from{' '}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              openrouter.ai/keys
            </a>
          </p>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Model
          </label>
          <DropDownList
            data={models}
            textField="name"
            dataItemKey="id"
            value={selectedModel}
            onChange={handleModelChange}
            loading={isLoadingModels}
            className="w-full"
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500">
              {models.length} models available
            </p>
            <button
              onClick={refreshModels}
              disabled={isLoadingModels || !formData.apiKey}
              className="text-xs text-blue-600 hover:underline disabled:text-gray-400"
            >
              {isLoadingModels ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Model Info */}
        {selectedModel && (
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm font-medium">{selectedModel.name}</div>
            {selectedModel.description && (
              <div className="text-xs text-gray-600 mt-1">{selectedModel.description}</div>
            )}
            <div className="text-xs text-gray-500 mt-2 space-y-1">
              <div>Context: {selectedModel.context_length?.toLocaleString()} tokens</div>
              <div>
                Pricing: ${parseFloat(selectedModel.pricing?.prompt || '0').toFixed(6)}/1K prompt,
                ${parseFloat(selectedModel.pricing?.completion || '0').toFixed(6)}/1K completion
              </div>
            </div>
          </div>
        )}

        {/* Site Information */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Site Name (Optional)
          </label>
          <Input
            value={formData.siteName}
            onChange={handleInputChange('siteName')}
            placeholder="Your Site Name"
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Used for OpenRouter rankings and analytics
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button onClick={onClose} fillMode="outline">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            themeColor="primary"
            disabled={!formData.apiKey}
          >
            Save
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 border-t pt-4">
          <p><strong>Note:</strong> Your API key is stored locally in your browser and never sent to our servers.</p>
          <p className="mt-2">
            For help setting up OpenRouter, visit their{' '}
            <a
              href="https://openrouter.ai/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              documentation
            </a>
          </p>
        </div>
      </div>
    </Dialog>
  );
}