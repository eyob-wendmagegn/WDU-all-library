// models/translationModel.js

/**
 * Translation Model
 * Contains all database queries for translation operations
 * This follows the same structure as your existing code
 */
export class TranslationModel {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('translations');
    this.DEFAULT_TRANSLATIONS = [
      {
        lang: 'en',
        data: {
          // === CORE ===
          welcome: 'Welcome back!',
          library: 'Library Management System',
          getStarted: 'Get Started',
          explore: 'Explore Our Collection',
          discover: 'Discover thousands of books and resources',
          learn: 'Learn Without Limits',
          anywhere: 'anywhere',
          anytime: 'anytime',
          woldiaUniversity: 'Woldia University',
          connectsReaders: 'Library connects readers with knowledge',
          firstTimeLogin: ' Login',
          activateAccount: 'Activate Account',
          activate: 'Activate',
          username: 'Username',
          enterUsername: 'Enter your username',
          id: 'ID',
          enterId: 'Enter your ID',
          continue: 'Continue',
          checking: 'Checking...',
          verifying: 'Verifying...',
          error: 'An error occurred',
          alreadySetPassword: 'Already set password?',
          loginHere: 'Login here',
          setYourPassword: 'Set Your Password',
          firstLoginInstructions: 'This is your first login – please create a secure password.',
          passwordMinLength: 'Password must be 6+ characters',
          passwordsDoNotMatch: 'Passwords do not match',
          passwordsMatch: 'Passwords match',
          sessionExpired: 'Session expired. Please try again.',
          passwordChanged: 'Password changed! Redirecting...',
          changePasswordFailed: 'Failed to change password',
          saving: 'Saving...',
          settingPassword: 'Setting Password...',
          changePassword: 'Change Password',
          setAndContinue: 'Set Password & Continue',
          login: 'Login',
          password: 'Password',
          enterPassword: 'Enter your password',
          showPassword: 'Show password',
          hidePassword: 'Hide password',
          signingIn: 'Signing in...',
          authenticating: 'Authenticating...',
          signIn: 'Sign In',
          loginFailed: 'Login failed',
          firstTime: 'First time accessing the system?',
          setPasswordHere: 'Set your password here',
          copyright: 'Woldia University Library System © 2025',
          minChars: 'Minimum 6 characters',
          email: 'Email',
        }
      },
      {
        lang: 'am',
        data: {
          // === CORE (Amharic) ===
          welcome: 'እንኳን ደህና መጡ!',
          library: 'የቤተ መጻሕፍት አስተዳደር ሲስተም',
          getStarted: 'ይጀምሩ',
          explore: 'የእኛን ስብስብ ያስሱ',
          discover: 'ሺህዎች መጻሕፍትና መረጃዎች ይግለጡ',
          learn: 'ያለ ገደብ ይማሩ',
          anywhere: 'በማንኛውም ቦታ',
          anytime: 'በማንኛውም ጊዜ',
          woldiaUniversity: 'ወልዲያ ዩኒቨርሲቲ',
          connectsReaders: 'ቤተ መጻሕፍቱ አንባቢዎችን ከእውቀት ጋር ያገናኛል',
          firstTimeLogin: ' መግቢያ',
          activateAccount: 'መለያ አግብር',
          activate: 'አግብር',
          username: 'የመጠቀሚያ ስም',
          enterUsername: 'የመጠቀሚያ ስምዎን ያስገቡ',
          id: 'መለያ ቁጥር',
          enterId: 'መለያ ቁጥርዎን ያስገቡ',
          continue: 'ቀጥል',
          checking: 'በመፈተሽ ላይ...',
          verifying: 'በማረጋገጥ ላይ...',
          error: 'ስህተት ተከስቷል',
          alreadySetPassword: 'የይለፍ ቃል ቀድሞ አዘጋጅተዋል?',
          loginHere: 'እዚህ ይግቡ',
          setYourPassword: 'የይለፍ ቃልዎን ያዘጋጁ',
          firstLoginInstructions: 'ይህ የመጀመሪያ ጊዜ መግባትዎ ነው – ደህንነቱ የተጠበቀ የይለፍ ቃል ይፍጠሩ።',
          passwordMinLength: 'የይለፍ ቃል ቢያንስ 6 ፊደል መሆን አለበት',
          passwordsDoNotMatch: 'የይለፍ ቃላቱ አይዛመዱም',
          passwordsMatch: 'የይለፍ ቃላት ተጣጥመዋል',
          sessionExpired: 'ክፍለ ጊዜው አብቅቷል። እንደገና ይሞክሩ።',
          passwordChanged: 'የይለፍ ቃል ተቀይሯል! ወደ መግቢያ ገጽ በመምራት ላይ...',
          changePasswordFailed: 'የይለፍ ቃል መቀየር አልተሳካም',
          saving: 'በማስቀመጥ ላይ...',
          settingPassword: 'የይለፍ ቃል በማዘጋጀት ላይ...',
          changePassword: 'የይለፍ ቃል ቀይር',
          setAndContinue: 'የይለፍ ቃል አዘጋጅተው ይቀጥሉ',
          login: 'መግባት',
          password: 'የይለፍ ቃል',
          enterPassword: 'የይለፍ ቃልዎን ያስገቡ',
          showPassword: 'የይለፍ ቃል አሳይ',
          hidePassword: 'የይለፍ ቃል ደብቅ',
          signingIn: 'በመግባት ላይ...',
          authenticating: 'በማረጋገጥ ላይ...',
          signIn: 'ግባ',
          loginFailed: 'መግባት አልተሳካም',
          firstTime: 'የሲስተሙ አዲስ ተጠቃሚ ነዎት?',
          setPasswordHere: 'እዚህ የይለፍ ቃል ያዘጋጁ',
          copyright: 'ወልዲያ ዩኒቨርሲቲ ቤተ መጻሕፍት ሲስተም © 2025',
          minChars: 'ቢያንስ 6 ፊደላት',
          email: 'ኢሜይል',
        }
      }
    ];
  }

  /**
   * Get translations for a specific language
   */
  async getTranslations(lang) {
    // Validate language
    if (!['en', 'am'].includes(lang)) {
      throw new Error('Invalid language. Supported languages: en, am');
    }

    // Try to get from database first
    let translationDoc = await this.collection.findOne({ lang });
    
    if (!translationDoc) {
      // If not found in DB, use default and save to DB
      const defaultTranslation = this.DEFAULT_TRANSLATIONS.find(t => t.lang === lang);
      if (defaultTranslation) {
        // Save to database for future use
        await this.collection.insertOne({
          ...defaultTranslation,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        translationDoc = defaultTranslation;
      }
    }

    if (!translationDoc) {
      throw new Error('Language not found');
    }

    return translationDoc.data || {};
  }

  /**
   * Get all available languages
   */
  async getAvailableLanguages() {
    const languages = await this.collection
      .find({})
      .project({ lang: 1, name: 1, _id: 0 })
      .toArray();
    
    // If no languages in DB, return defaults
    if (languages.length === 0) {
      return this.DEFAULT_TRANSLATIONS.map(t => ({
        lang: t.lang,
        name: t.lang === 'en' ? 'English' : 'Amharic'
      }));
    }
    
    // Add language names
    return languages.map(lang => ({
      ...lang,
      name: lang.lang === 'en' ? 'English' : 
            lang.lang === 'am' ? 'Amharic' : 
            lang.lang.charAt(0).toUpperCase() + lang.lang.slice(1)
    }));
  }

  /**
   * Update translations for a language
   */
  async updateTranslations(lang, translations, updatedBy = null) {
    if (!lang || !translations || typeof translations !== 'object') {
      throw new Error('Invalid parameters');
    }

    // Check if language exists
    const existing = await this.collection.findOne({ lang });
    
    const translationData = {
      lang,
      data: translations,
      updatedBy: updatedBy || 'system',
      updatedAt: new Date()
    };

    let result;
    if (existing) {
      // Update existing
      result = await this.collection.updateOne(
        { lang },
        { $set: translationData }
      );
    } else {
      // Insert new
      translationData.createdAt = new Date();
      result = await this.collection.insertOne(translationData);
    }

    return {
      success: true,
      operation: existing ? 'updated' : 'created',
      lang,
      modifiedCount: result.modifiedCount || 0
    };
  }

  /**
   * Add new language
   */
  async addLanguage(lang, translations, languageName = null) {
    if (!lang || !translations) {
      throw new Error('Language code and translations are required');
    }

    // Check if language already exists
    const existing = await this.collection.findOne({ lang });
    if (existing) {
      throw new Error(`Language '${lang}' already exists`);
    }

    const languageData = {
      lang,
      name: languageName || lang.charAt(0).toUpperCase() + lang.slice(1),
      data: translations,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.collection.insertOne(languageData);

    return {
      success: true,
      message: `Language '${lang}' added successfully`,
      language: { ...languageData, _id: result.insertedId }
    };
  }

  /**
   * Delete language
   */
  async deleteLanguage(lang) {
    if (!lang) {
      throw new Error('Language code is required');
    }

    // Prevent deletion of default languages if needed
    const protectedLanguages = ['en', 'am'];
    if (protectedLanguages.includes(lang)) {
      throw new Error(`Language '${lang}' is protected and cannot be deleted`);
    }

    const result = await this.collection.deleteOne({ lang });

    return {
      success: result.deletedCount > 0,
      deletedCount: result.deletedCount,
      message: result.deletedCount > 0 
        ? `Language '${lang}' deleted successfully` 
        : `Language '${lang}' not found`
    };
  }

  /**
   * Get translation keys and values for all languages
   */
  async getAllTranslationsFormatted() {
    const languages = await this.collection.find({}).toArray();
    
    // Create a map of all unique keys across languages
    const allKeys = new Set();
    languages.forEach(lang => {
      if (lang.data) {
        Object.keys(lang.data).forEach(key => allKeys.add(key));
      }
    });
    
    // Format as array of objects for easy display/editing
    const formatted = Array.from(allKeys).map(key => {
      const keyData = { key };
      languages.forEach(lang => {
        keyData[lang.lang] = lang.data?.[key] || '';
      });
      return keyData;
    });
    
    return {
      keys: formatted,
      languages: languages.map(l => ({ lang: l.lang, name: l.name || l.lang })),
      totalKeys: allKeys.size,
      totalLanguages: languages.length
    };
  }

  /**
   * Search translations
   */
  async searchTranslations(searchTerm, lang = null) {
    const query = {};
    
    if (lang) {
      query.lang = lang;
    }
    
    const languages = await this.collection.find(query).toArray();
    
    const results = [];
    
    languages.forEach(language => {
      if (language.data) {
        Object.entries(language.data).forEach(([key, value]) => {
          if (
            key.toLowerCase().includes(searchTerm.toLowerCase()) ||
            value.toLowerCase().includes(searchTerm.toLowerCase())
          ) {
            results.push({
              lang: language.lang,
              key,
              value,
              matches: {
                key: key.toLowerCase().includes(searchTerm.toLowerCase()),
                value: value.toLowerCase().includes(searchTerm.toLowerCase())
              }
            });
          }
        });
      }
    });
    
    return {
      results,
      total: results.length,
      searchTerm,
      langFilter: lang
    };
  }

  /**
   * Get translation statistics
   */
  async getTranslationStats() {
    const languages = await this.collection.find({}).toArray();
    
    const stats = languages.map(lang => {
      const keyCount = lang.data ? Object.keys(lang.data).length : 0;
      return {
        lang: lang.lang,
        name: lang.name || lang.lang,
        keyCount,
        lastUpdated: lang.updatedAt || lang.createdAt,
        completeness: keyCount > 0 ? 'Complete' : 'Empty'
      };
    });
    
    const totalKeys = new Set();
    languages.forEach(lang => {
      if (lang.data) {
        Object.keys(lang.data).forEach(key => totalKeys.add(key));
      }
    });
    
    return {
      totalLanguages: languages.length,
      totalKeys: totalKeys.size,
      languages: stats,
      lastUpdated: new Date()
    };
  }

  /**
   * Export translations as JSON
   */
  async exportTranslations(format = 'json') {
    const languages = await this.collection.find({}).toArray();
    
    const exportData = {};
    languages.forEach(lang => {
      exportData[lang.lang] = lang.data || {};
    });
    
    if (format === 'json') {
      return {
        format: 'json',
        data: exportData,
        timestamp: new Date().toISOString()
      };
    }
    
    // Could add other formats like CSV, XLIFF, etc.
    throw new Error(`Format '${format}' not supported`);
  }

  /**
   * Import translations from JSON
   */
  async importTranslations(importData, merge = true, importedBy = null) {
    if (!importData || typeof importData !== 'object') {
      throw new Error('Invalid import data');
    }
    
    const results = [];
    
    for (const [lang, translations] of Object.entries(importData)) {
      if (typeof translations !== 'object') {
        results.push({
          lang,
          success: false,
          error: 'Invalid translations format'
        });
        continue;
      }
      
      try {
        const existing = await this.collection.findOne({ lang });
        
        if (existing && merge) {
          // Merge with existing
          const mergedData = { ...existing.data, ...translations };
          await this.collection.updateOne(
            { lang },
            { 
              $set: { 
                data: mergedData,
                updatedBy: importedBy || 'import',
                updatedAt: new Date()
              } 
            }
          );
          results.push({
            lang,
            success: true,
            operation: 'merged',
            keysAdded: Object.keys(translations).length,
            totalKeys: Object.keys(mergedData).length
          });
        } else {
          // Replace or create new
          const langData = {
            lang,
            data: translations,
            updatedBy: importedBy || 'import',
            updatedAt: new Date()
          };
          
          if (existing) {
            await this.collection.updateOne(
              { lang },
              { $set: langData }
            );
            results.push({
              lang,
              success: true,
              operation: 'replaced',
              keysAdded: Object.keys(translations).length
            });
          } else {
            langData.createdAt = new Date();
            await this.collection.insertOne(langData);
            results.push({
              lang,
              success: true,
              operation: 'created',
              keysAdded: Object.keys(translations).length
            });
          }
        }
      } catch (error) {
        results.push({
          lang,
          success: false,
          error: error.message
        });
      }
    }
    
    return {
      success: true,
      results,
      totalProcessed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };
  }

  /**
   * Get missing translations for a language
   */
  async getMissingTranslations(lang) {
    // Get all languages to find all keys
    const languages = await this.collection.find({}).toArray();
    
    // Find all unique keys across all languages
    const allKeys = new Set();
    languages.forEach(l => {
      if (l.data) {
        Object.keys(l.data).forEach(key => allKeys.add(key));
      }
    });
    
    // Get target language
    const targetLang = await this.collection.findOne({ lang });
    const targetKeys = targetLang?.data ? Object.keys(targetLang.data) : [];
    
    // Find missing keys
    const missingKeys = Array.from(allKeys).filter(key => !targetKeys.includes(key));
    
    // Get English values as reference for missing keys
    const english = await this.collection.findOne({ lang: 'en' });
    const referenceValues = {};
    
    missingKeys.forEach(key => {
      referenceValues[key] = english?.data?.[key] || '';
    });
    
    return {
      lang,
      missingCount: missingKeys.length,
      totalKeys: allKeys.size,
      missingKeys,
      referenceValues,
      completeness: targetKeys.length > 0 
        ? ((targetKeys.length / allKeys.size) * 100).toFixed(1) + '%' 
        : '0%'
    };
  }

  /**
   * Initialize default translations
   */
  async initializeDefaultTranslations() {
    const initialized = [];
    
    for (const defaultLang of this.DEFAULT_TRANSLATIONS) {
      const existing = await this.collection.findOne({ lang: defaultLang.lang });
      
      if (!existing) {
        await this.collection.insertOne({
          ...defaultLang,
          name: defaultLang.lang === 'en' ? 'English' : 'Amharic',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        initialized.push(defaultLang.lang);
      }
    }
    
    return {
      success: true,
      initialized,
      message: initialized.length > 0 
        ? `Initialized languages: ${initialized.join(', ')}` 
        : 'All default languages already exist'
    };
  }
}

/**
 * Initialize and export the TranslationModel instance
 */
export function initTranslationModel(db) {
  return new TranslationModel(db);
}

/**
 * Default export for convenience
 */
export default TranslationModel;