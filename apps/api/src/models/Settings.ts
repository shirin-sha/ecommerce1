import mongoose, { Schema, Document } from 'mongoose'
import { Address } from '@ecommerce/shared'

export interface ISettings extends Document {
  general: {
    storeName: string
    storeAddress: Address
    currency: string
    currencyPosition: 'left' | 'right' | 'left_space' | 'right_space'
    thousandSeparator: string
    decimalSeparator: string
    numDecimals: number
    sellingLocations: string[]
    shippingLocations: string[]
    defaultCustomerLocation: string
    enableTaxes: boolean
    enableCoupons: boolean
  }
  products: {
    shopRoute: string
    ajaxAddToCart: boolean
    weightUnit: 'kg' | 'g' | 'lbs' | 'oz'
    dimensionUnit: 'cm' | 'm' | 'mm' | 'in' | 'yd'
    reviewsEnabled: boolean
    verifiedOwnerLabel: boolean
    verifiedOwnerOnly: boolean
    enableRatings: boolean
    ratingsRequired: boolean
  }
  inventory: {
    enableStockMgmt: boolean
    holdStockMinutes: number
    lowStockThreshold: number
    outOfStockThreshold: number
    notificationEmails: string[]
    hideOutOfStock: boolean
    stockDisplayFormat: 'always' | 'low_stock' | 'never'
    enableLowStockNotifications: boolean
    enableOutOfStockNotifications: boolean
  }
  shipping: {
    zones: {
      _id: mongoose.Types.ObjectId
      name: string
      regions: string[]
      methods: {
        type: 'flat_rate' | 'free_shipping' | 'local_pickup'
        title: string
        cost?: number
        enabled: boolean
      }[]
    }[]
  }
  payments: {
    providers: {
      id: string
      enabled: boolean
      title: string
      description?: string
      sandbox: boolean
      credentials: Record<string, string>
    }[]
  }
  emails: {
    fromName: string
    fromEmail: string
    templates: {
      newOrder: { enabled: boolean; recipients: string[] }
      cancelledOrder: { enabled: boolean; recipients: string[] }
      failedOrder: { enabled: boolean; recipients: string[] }
      orderOnHold: { enabled: boolean }
      processingOrder: { enabled: boolean }
      completedOrder: { enabled: boolean }
      refundedOrder: { enabled: boolean }
      customerNote: { enabled: boolean }
      resetPassword: { enabled: boolean }
      newAccount: { enabled: boolean }
    }
    style: {
      headerImage?: string
      baseColor: string
      backgroundColor: string
      bodyBackgroundColor: string
      bodyTextColor: string
      footerText?: string
      footerTextColor: string
    }
  }
  siteVisibility: 'coming_soon' | 'live'
  tracking: {
    ga4MeasurementId?: string
    metaPixelId?: string
    tiktokPixelId?: string
  }
  updatedAt: Date
}

const settingsSchema = new Schema<ISettings>(
  {
    general: {
      storeName: { type: String, default: 'My Store' },
      storeAddress: {
        firstName: String,
        lastName: String,
        company: String,
        address1: { type: String, default: '' },
        address2: String,
        city: { type: String, default: '' },
        state: String,
        postcode: { type: String, default: '' },
        country: { type: String, default: 'US' },
        phone: String,
      },
      currency: { type: String, default: 'USD' },
      currencyPosition: { type: String, enum: ['left', 'right', 'left_space', 'right_space'], default: 'left' },
      thousandSeparator: { type: String, default: ',' },
      decimalSeparator: { type: String, default: '.' },
      numDecimals: { type: Number, default: 2 },
      sellingLocations: { type: [String], default: ['all'] },
      shippingLocations: { type: [String], default: ['all'] },
      defaultCustomerLocation: { type: String, default: 'shop_country' },
      enableTaxes: { type: Boolean, default: false },
      enableCoupons: { type: Boolean, default: true },
    },
    products: {
      shopRoute: { type: String, default: '/shop' },
      ajaxAddToCart: { type: Boolean, default: false },
      weightUnit: { type: String, enum: ['kg', 'g', 'lbs', 'oz'], default: 'kg' },
      dimensionUnit: { type: String, enum: ['cm', 'm', 'mm', 'in', 'yd'], default: 'cm' },
      reviewsEnabled: { type: Boolean, default: true },
      verifiedOwnerLabel: { type: Boolean, default: true },
      verifiedOwnerOnly: { type: Boolean, default: false },
      enableRatings: { type: Boolean, default: true },
      ratingsRequired: { type: Boolean, default: false },
    },
    inventory: {
      enableStockMgmt: { type: Boolean, default: true },
      holdStockMinutes: { type: Number, default: 60 },
      lowStockThreshold: { type: Number, default: 2 },
      outOfStockThreshold: { type: Number, default: 0 },
      notificationEmails: { type: [String], default: [] },
      hideOutOfStock: { type: Boolean, default: false },
      stockDisplayFormat: { type: String, enum: ['always', 'low_stock', 'never'], default: 'always' },
      enableLowStockNotifications: { type: Boolean, default: true },
      enableOutOfStockNotifications: { type: Boolean, default: true },
    },
    shipping: {
      zones: [
        {
          _id: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
          name: String,
          regions: [String],
          methods: [
            {
              type: { type: String, enum: ['flat_rate', 'free_shipping', 'local_pickup'] },
              title: String,
              cost: Number,
              enabled: { type: Boolean, default: true },
            },
          ],
        },
      ],
    },
    payments: {
      providers: [
        {
          id: String,
          enabled: { type: Boolean, default: false },
          title: String,
          description: String,
          sandbox: { type: Boolean, default: true },
          credentials: { type: Map, of: String },
        },
      ],
    },
    emails: {
      fromName: { type: String, default: 'My Store' },
      fromEmail: { type: String, default: 'noreply@example.com' },
      templates: {
        newOrder: { enabled: { type: Boolean, default: true }, recipients: [String] },
        cancelledOrder: { enabled: { type: Boolean, default: true }, recipients: [String] },
        failedOrder: { type: Boolean, default: true, recipients: [String] },
        orderOnHold: { enabled: { type: Boolean, default: true } },
        processingOrder: { enabled: { type: Boolean, default: true } },
        completedOrder: { enabled: { type: Boolean, default: true } },
        refundedOrder: { enabled: { type: Boolean, default: true } },
        customerNote: { enabled: { type: Boolean, default: true } },
        resetPassword: { enabled: { type: Boolean, default: true } },
        newAccount: { enabled: { type: Boolean, default: true } },
      },
      style: {
        headerImage: String,
        baseColor: { type: String, default: '#96588a' },
        backgroundColor: { type: String, default: '#f7f7f7' },
        bodyBackgroundColor: { type: String, default: '#ffffff' },
        bodyTextColor: { type: String, default: '#3c3c3c' },
        footerText: String,
        footerTextColor: { type: String, default: '#3c3c3c' },
      },
    },
    siteVisibility: { type: String, enum: ['coming_soon', 'live'], default: 'live' },
    tracking: {
      ga4MeasurementId: String,
      metaPixelId: String,
      tiktokPixelId: String,
    },
  },
  {
    timestamps: true,
  }
)

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne()
  if (!settings) {
    settings = await this.create({})
  }
  return settings
}

export const Settings = mongoose.models.Settings || mongoose.model<ISettings>('Settings', settingsSchema)
