import { useForm } from 'react-hook-form'
import { useSettings, useUpdateGeneralSettings } from '../hooks/useSettings'
import { Save } from 'lucide-react'

export default function SettingsGeneral() {
  const { data: settings, isLoading } = useSettings()
  const updateSettings = useUpdateGeneralSettings()

  const { register, handleSubmit } = useForm({
    values: settings?.general,
  })

  const onSubmit = async (data: any) => {
    await updateSettings.mutateAsync(data)
    alert('Settings saved successfully')
  }

  if (isLoading) {
    return <div className="p-8">Loading settings...</div>
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">General Settings</h1>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Store Information */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Store Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Name
              </label>
              <input
                type="text"
                {...register('storeName')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 1
              </label>
              <input
                type="text"
                {...register('storeAddress.address1')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                {...register('storeAddress.address2')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  {...register('storeAddress.city')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  {...register('storeAddress.state')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Postcode</label>
                <input
                  type="text"
                  {...register('storeAddress.postcode')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <input
                  type="text"
                  {...register('storeAddress.country')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Currency Options */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Currency Options</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <select
                  {...register('currency')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="GBP">British Pound (£)</option>
                  <option value="KWD">Kuwaiti Dinar (KD)</option>
                  <option value="SAR">Saudi Riyal (SR)</option>
                  <option value="AED">UAE Dirham (AED)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency Position
                </label>
                <select
                  {...register('currencyPosition')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="left">Left ($99.99)</option>
                  <option value="right">Right (99.99$)</option>
                  <option value="left_space">Left with space ($ 99.99)</option>
                  <option value="right_space">Right with space (99.99 $)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thousand Separator
                </label>
                <input
                  type="text"
                  {...register('thousandSeparator')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Decimal Separator
                </label>
                <input
                  type="text"
                  {...register('decimalSeparator')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Decimals
                </label>
                <input
                  type="number"
                  {...register('numDecimals')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Store Options */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Store Options</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('enableTaxes')} className="w-4 h-4" />
              <span className="text-sm">Enable taxes</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('enableCoupons')} className="w-4 h-4" />
              <span className="text-sm">Enable coupons</span>
            </label>
          </div>
        </div>
      </div>
    </form>
  )
}
