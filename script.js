// تهيئة Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getDatabase, ref, push, onValue, child, get, set, remove, update,
    query, orderByChild, limitToLast, startAt, endAt
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAtqvEzoqQoCtHS_wvc5mAzb5WKOW1MaeI",
    authDomain: "realestate-d4e29.firebaseapp.com",
    databaseURL: "https://realestate-d4e29-default-rtdb.firebaseio.com",
    projectId: "realestate-d4e29",
    storageBucket: "realestate-d4e29.appspot.com",
    messagingSenderId: "341854632202",
    appId: "1:341854632202:web:7666024e83d2b9c94962f3"
};

// ==================== التهيئة الرئيسية ====================
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// مراجع Firebase
const getFirebaseRefs = () => ({
    productsRef: ref(db, 'storeProducts'),
    categoriesRef: ref(db, 'storeCategories'),
    contactRef: ref(db, 'storeContactInfo'),
    faqRef: ref(db, 'storeFaqs'),
    ordersRef: ref(db, 'storeOrders'),
    servicesRef: ref(db, 'storeservices'),
    statsRef: ref(db, 'storestats'),
    promosRef: ref(db, 'storePromotions'),
    welcomeRef: ref(db, 'storeWelcomeMessage/text'),
    aboutRef: ref(db, 'storeAboutUs'),
    responsesRef: ref(db, 'storeBotResponses'),
    messagesRef: ref(db, 'customerMessages')
});

// ==================== نظام إدارة الذاكرة والتحميل البطيء ====================
class MemoryManager {
    constructor() {
        this.cache = new Map();
        this.cleanupInterval = setInterval(() => this.cleanup(), 30000);
    }

    set(key, data, ttl = 300000) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    get(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    cleanup() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > value.ttl) {
                this.cache.delete(key);
            }
        }
    }

    clear() {
        this.cache.clear();
    }
}

class LazyLoader {
    constructor() {
        this.loadedSections = new Set();
        this.observers = new Map();
    }

    async loadSection(sectionId, loader) {
        if (this.loadedSections.has(sectionId)) {
            return;
        }

        try {
            await loader();
            this.loadedSections.add(sectionId);
        } catch (error) {
            console.error(`خطأ في تحميل القسم ${sectionId}:`, error);
        }
    }

    observeElement(elementId, callback, options = {}) {
        if (this.observers.has(elementId)) {
            return;
        }

        const element = document.getElementById(elementId);
        if (!element) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    callback();
                    observer.unobserve(entry.target);
                    this.observers.delete(elementId);
                }
            });
        }, { 
            rootMargin: '100px',
            threshold: 0.1,
            ...options
        });

        observer.observe(element);
        this.observers.set(elementId, observer);
    }
}

const memoryManager = new MemoryManager();
const lazyLoader = new LazyLoader();

// ==================== نظام التحميل السريع المحسن ====================
class FastLoadingSystem {
    constructor() {
        this.minLoadingTime = 800;
        this.startTime = Date.now();
        this.loadingSteps = [
            "جاري التحميل...",
            "جاري تحميل البيانات الأساسية...", 
            "جاري تهيئة الواجهة...",
            "تم التحميل بنجاح!"
        ];
        this.currentStep = 0;
    }

    async init() {
        try {
            this.hideMainContent();
            this.updateLoadingMessage(0);
            
            // تحميل متوازي مع ضمان عدم التوقف
            await Promise.race([
                Promise.all([
                    this.loadCriticalData(),
                    this.initEssentialUI()
                ]),
                new Promise(resolve => setTimeout(resolve, 5000)) // وقت انتظار أقصى 5 ثوان
            ]);
            
            await this.ensureMinimumLoadingTime();
            this.complete();
        } catch (error) {
            console.error('خطأ في التحميل:', error);
            this.complete(); // الاستمرار حتى مع وجود أخطاء
        }
    }

    hideMainContent() {
        const elements = document.querySelectorAll('.section-content, .desktop-sidebar, .mobile-header');
        elements.forEach(el => {
            el.style.opacity = '0';
        });
    }

    showMainContent() {
        const elements = document.querySelectorAll('.section-content, .desktop-sidebar, .mobile-header');
        elements.forEach(el => {
            el.style.opacity = '1';
            el.style.transition = 'opacity 0.3s ease';
        });
    }

    updateLoadingMessage(step) {
        this.currentStep = step;
        const messageElement = document.querySelector('.loading-message');
        if (messageElement && this.loadingSteps[step]) {
            messageElement.textContent = this.loadingSteps[step];
        }
        
        const progress = ((step + 1) / this.loadingSteps.length) * 100;
        this.updateProgress(progress);
    }

    updateProgress(percentage) {
        const progressFill = document.querySelector('.loading-progress-fill');
        const progressText = document.querySelector('.loading-progress-text');
        
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        if (progressText) {
            progressText.textContent = `${Math.round(percentage)}%`;
        }
    }

    async loadCriticalData() {
        this.updateLoadingMessage(1);
        try {
            await this.loadDashboardData();
            await this.loadNotifications();
        } catch (error) {
            console.error('خطأ في تحميل البيانات الحرجة:', error);
        }
    }

    async loadDashboardData() {
        return new Promise((resolve) => {
            const { ordersRef, messagesRef } = getFirebaseRefs();
            
            let loaded = 0;
            const total = 2;
            let hasError = false;

            const checkComplete = () => {
                loaded++;
                if (loaded >= total) {
                    resolve();
                }
            };

            // استخدام استعلامات منفصلة مع معالجة أخطاء
            try {
                const ordersQuery = query(ordersRef, limitToLast(50));
                onValue(ordersQuery, (snapshot) => {
                    if (!hasError) {
                        updateOrdersBadgeGlobal(snapshot.val() || {});
                        checkComplete();
                    }
                }, (error) => {
                    console.error('خطأ في تحميل الطلبات:', error);
                    hasError = true;
                    checkComplete();
                }, { onlyOnce: true });
            } catch (error) {
                console.error('خطأ في استعلام الطلبات:', error);
                loaded++;
            }

            try {
                onValue(messagesRef, (snapshot) => {
                    if (!hasError) {
                        updateMessagesBadgeGlobal(snapshot.val() || {});
                        checkComplete();
                    }
                }, (error) => {
                    console.error('خطأ في تحميل الرسائل:', error);
                    hasError = true;
                    checkComplete();
                }, { onlyOnce: true });
            } catch (error) {
                console.error('خطأ في استعلام الرسائل:', error);
                loaded++;
            }

            // ضمان الحل في حالة فشل جميع الاستعلامات
            setTimeout(() => {
                if (loaded < total) {
                    console.warn('تم تجاوز وقت انتظار تحميل البيانات');
                    resolve();
                }
            }, 10000);
        });
    }

    async loadNotifications() {
        const { ordersRef, messagesRef } = getFirebaseRefs();
        
        try {
            const ordersQuery = query(ordersRef, limitToLast(100));
            onValue(ordersQuery, (snapshot) => {
               updateOrdersBadgeGlobal(snapshot.val() || {});
            });
        } catch (error) {
            console.error('خطأ في تحميل إشعارات الطلبات:', error);
        }

        try {
            onValue(messagesRef, (snapshot) => {
               updateMessagesBadgeGlobal(snapshot.val() || {});
            });
        } catch (error) {
            console.error('خطأ في تحميل إشعارات الرسائل:', error);
        }
    }

    initEssentialUI() {
        this.updateLoadingMessage(2);
        
        // تهيئة المكونات الأساسية مع معالجة الأخطاء
        try {
            setupNavigation();
            initWelcomeDashboard();
            if (typeof AnimatedMobileMenu !== 'undefined') {
                new AnimatedMobileMenu();
            }
            setupIconPickers();
            setupTheme();
        } catch (error) {
            console.error('خطأ في تهيئة الواجهة:', error);
        }
    }

    async ensureMinimumLoadingTime() {
        const elapsed = Date.now() - this.startTime;
        const remaining = this.minLoadingTime - elapsed;
        
        if (remaining > 0) {
            await new Promise(resolve => setTimeout(resolve, remaining));
        }
    }

    complete() {
        this.updateLoadingMessage(3);
        
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                loadingScreen.style.transition = 'opacity 0.3s ease';
                
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    this.showMainContent();
                    this.loadNonCriticalData();
                }, 300);
            }
        }, 500);
    }

    loadNonCriticalData() {
        setTimeout(() => {
            this.initLazySections();
        }, 1000);
    }

    initLazySections() {
        const sectionConfigs = {
            'welcome': { loader: initWelcomeSection, priority: 'low' },
            'faq': { loader: initFAQSection, priority: 'medium' },
            'contact': { loader: initContactSection, priority: 'medium' },
            'serv': { loader: initServicesSection, priority: 'medium' },
            'stats': { loader: initStatsSection, priority: 'low' },
            'time': { loader: initPromoSection, priority: 'medium' },
            'who': { loader: initAboutSection, priority: 'low' },
            'products': { loader: initProductsSection, priority: 'high' },
            'orders': { loader: initOrdersSection, priority: 'high' },
            'categories': { loader: initCategoriesSection, priority: 'high' },
            'bot': { loader: initBotSection, priority: 'medium' },
            'customer-messages': { loader: initCustomerMessagesSection, priority: 'high' }
        };

        const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
        const sortedSections = Object.entries(sectionConfigs)
            .sort((a, b) => priorityOrder[a[1].priority] - priorityOrder[b[1].priority]);

        sortedSections.forEach(([sectionId, config]) => {
            const sectionElement = document.getElementById(sectionId);
            if (sectionElement) {
                lazyLoader.observeElement(sectionId, () => {
                    lazyLoader.loadSection(sectionId, config.loader);
                });
            }
        });
    }
}

// ==================== نظام إدارة الحالة ====================
class AppState {
    constructor() {
        this.initializedSections = new Set();
        this.pendingRequests = new Map();
    }

    markSectionInitialized(sectionId) {
        this.initializedSections.add(sectionId);
    }

    isSectionInitialized(sectionId) {
        return this.initializedSections.has(sectionId);
    }

    addPendingRequest(key, promise) {
        this.pendingRequests.set(key, promise);
    }

    getPendingRequest(key) {
        return this.pendingRequests.get(key);
    }

    removePendingRequest(key) {
        this.pendingRequests.delete(key);
    }
}

const appState = new AppState();

// ==================== الأدوات المساعدة  ====================
const utils = {
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    escapeHtml(s) {
        if (!s) return '';
        const div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    },

    getTimeAgo(timestamp) {
        if (!timestamp) return 'غير معروف';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
    
        if (diffInSeconds < 60) return 'الآن';
        if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
        if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
        if (diffInSeconds < 2592000) return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
    
        return date.toLocaleDateString('en-US');
    },

    showToast(message, type = 'success') {
        // إنشاء toast إذا لم يكن موجوداً
        let toast = document.getElementById('global-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'global-toast';
            toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        max-width: 500px;
        width: 90%;
        min-width: 300px;
        opacity: 0;
        transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        text-align: center;
        font-family: 'Tajawal', sans-serif;
        font-weight: 600;
        font-size: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        `;
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        if (type === 'success') {
            toast.style.background = '#06b6d4';
        } else if (type === 'error') {
            toast.style.background = '#f72585';
        } else if (type === 'info') {
            toast.style.background = '#3498db'; 
        }
        toast.style.opacity = '1';

       setTimeout(() => {
               toast.style.opacity = '1';
               toast.style.transform = 'translateX(-50%) translateY(0)';
           }, 10);
       
           // إخفاء الإشعار بعد 3 ثواني
           setTimeout(() => {
               toast.style.opacity = '0';
               toast.style.transform = 'translateX(-50%) translateY(-100px)';
               
               // إزالة العنصر من DOM بعد انتهاء الأنيميشن
               setTimeout(() => {
                   if (toast.parentNode) {
                       toast.remove();
                   }
               }, 600);
           }, 3000);
    },

    async loadSectionData(sectionId, ref, processor, options = {}) {
        const cacheKey = `${sectionId}_data`;
        const cached = memoryManager.get(cacheKey);
        
        if (cached) {
            return processor(cached);
        }

        const pendingRequest = appState.getPendingRequest(cacheKey);
        if (pendingRequest) {
            return pendingRequest;
        }

        const dataPromise = new Promise((resolve, reject) => {
            const refToUse = options.query ? query(ref, ...options.query) : ref;
            
            onValue(refToUse, (snapshot) => {
                const data = snapshot.val() || {};
                memoryManager.set(cacheKey, data, options.ttl || 300000);
                processor(data);
                appState.removePendingRequest(cacheKey);
                resolve(data);
            }, (error) => {
                console.error(`خطأ في تحميل بيانات ${sectionId}:`, error);
                appState.removePendingRequest(cacheKey);
                reject(error);
            }, { onlyOnce: options.once !== false });
        });

        appState.addPendingRequest(cacheKey, dataPromise);
        return dataPromise;
    },

    renderChunked(items, container, renderItem, chunkSize = 10, delay = 0) {
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!items || items.length === 0) return;
        
        let index = 0;
        
        function renderNextChunk() {
            const chunk = items.slice(index, index + chunkSize);
            const fragment = document.createDocumentFragment();
            
            chunk.forEach(item => {
                const element = renderItem(item);
                if (element) {
                    fragment.appendChild(element);
                }
            });
            
            container.appendChild(fragment);
            index += chunkSize;
            
            if (index < items.length) {
                setTimeout(renderNextChunk, delay);
            }
        }
        
        renderNextChunk();
    },

    // دالة بحث محسنة
    searchData(data, query, fields = []) {
        if (!query || !data) return Object.entries(data || {});
        
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        
        return Object.entries(data).filter(([key, item]) => {
            const searchText = fields.map(field => {
                const value = this.getNestedValue(item, field);
                return value ? value.toString().toLowerCase() : '';
            }).join(' ');

            return searchTerms.every(term => searchText.includes(term));
        });
    },

    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : '';
        }, obj);
    },

    // تحسين الأداء للبيانات الكبيرة
    optimizeLargeData(data, maxItems = 1000) {
        if (!data || typeof data !== 'object') return data;
        
        const entries = Object.entries(data);
        if (entries.length <= maxItems) return data;
        
        // إرجاع أحدث العناصر فقط
        return Object.fromEntries(
            entries
                .sort(([,a], [,b]) => (b.timestamp || 0) - (a.timestamp || 0))
                .slice(0, maxItems)
        );
    },

    // دالة جديدة لتحميل الصور بذكاء
    loadImage(url, element, placeholder = '') {
        if (!url || !element) return;
        
        const img = new Image();
        img.onload = () => {
            if (element.tagName === 'IMG') {
                element.src = url;
            } else {
                element.style.backgroundImage = `url(${url})`;
            }
        };
        img.onerror = () => {
            if (placeholder && element.tagName === 'IMG') {
                element.src = placeholder;
            }
        };
        img.src = url;
    },

    createModalHeader: function(title, icon = 'fas fa-edit') {
        return `
            <div class="modal-header-unified">
                <h2 class="modal-title-unified">
                    <i class="${icon}" style="margin-left: 8px;"></i> 
                    ${title}
                </h2>
                <button class="modal-close-unified close" type="button">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    },

    setupModalClose: function(modal, modalRoot) {
        // جميع أزرار الإغلاق المحتملة
        const closeSelectors = [
            '.modal-close-unified',
            '.grid-btn.close', 
            '.close-btn-unified',
            '.modal-close'
        ];
        
        closeSelectors.forEach(selector => {
            const closeBtns = modal.querySelectorAll(selector);
            closeBtns.forEach(closeBtn => {
                closeBtn.addEventListener('click', () => {
                    modal.style.opacity = '0';
                    setTimeout(() => {
                        modal.remove();
                        if (modalRoot) modalRoot.style.display = 'none';
                    }, 300);
                });
            });
        });
    },

    handleJSONImportError: function(error) {
        console.error('خطأ في الاستيراد:', error);
        this.showToast('حدث خطأ في استيراد الملف: ' + error.message, 'error');
    },

    // === دوال شريط التقدم ===
    createProgressBar: function(title, icon) {
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar-modal';
    progressBar.innerHTML = `
        <div class="progress-container">
            <div class="progress-header">
                <i class="${icon} progress-bar-icon"></i>
                <div class="progress-header-content">
                    <div class="progress-title">${title}</div>
                    <div class="progress-status" id="progressStatus">جاري التحضير...</div>
                </div>
            </div>
            <div class="progress-track">
                <div class="progress-fill" id="progressFill"></div>
            </div>
            <div class="progress-details">
                <span class="progress-text" id="progressText">0%</span>
                <span class="progress-count" id="progressCount">0/0</span>
            </div>
        </div>
    `;
    document.body.appendChild(progressBar);
    return progressBar;
    },
    
    updateProgressBar: function(progressBar, current, total) {
        const progress = Math.round(((current + 1) / total) * 100);
        const progressFill = progressBar.querySelector('#progressFill');
        const progressText = progressBar.querySelector('#progressText');
        const progressCount = progressBar.querySelector('#progressCount');
        const progressStatus = progressBar.querySelector('#progressStatus');
        
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${progress}%`;
        if (progressCount) progressCount.textContent = `${current + 1}/${total}`;
        if (progressStatus) {
            progressStatus.textContent = `جاري استيراد العنصر ${current + 1} من ${total}`;
        }
    },
    
    completeProgressBar: function(progressBar) {
        const progressFill = progressBar.querySelector('#progressFill');
        const progressStatus = progressBar.querySelector('#progressStatus');
        
        if (progressFill) {
            progressFill.style.background = 'linear-gradient(90deg, #22c55e, #16a34a)';
        }
        if (progressStatus) progressStatus.textContent = 'اكتمل الاستيراد';
        
        setTimeout(() => {
            this.removeProgressBar(progressBar);
        }, 1500);
    },

    removeProgressBar: function(progressBar) {
        if (progressBar && progressBar.parentNode) {
            progressBar.remove();
        }
    },

    normalizeOrderStatus(order) {
    if (!order) return 'new';
    
    if (!order.status) {
        return 'new';
    }
    
    const status = order.status.toLowerCase();
    
    // الحالات الجديدة والمحدثة
    if (status === 'new' || status === 'جديد' || status === 'pending' || status === 'قيد الانتظار' || status === 'paid' || status === 'مدفوع') {
        return 'new';
    } else if (status === 'confirmed' || status === 'تم التأكيد' || status === 'مؤكد') {
        return 'confirmed';
    } else if (status === 'processing' || status === 'قيد التجهيز' || status === 'in_progress') {
        return 'processing';
    } else if (status === 'shipped' || status === 'تم الشحن' || status === 'شحن') {
        return 'shipped';
    } else if (status === 'completed' || status === 'مكتمل' || status === 'delivered' || status === 'تم التسليم') {
        return 'completed';
    } else if (status === 'cancelled' || status === 'ملغي' || status === 'canceled') {
        return 'cancelled';
    }
    
    return 'new';
    }

};

// ==================== نظام إدارة الحالات الفارغة الموحد ====================
class UnifiedEmptyStateManager {
    constructor() {
        this.sectionConfigs = {
            'faq': { icon: 'fas fa-question-circle', title: 'لا توجد أسئلة', message: 'لم تقم بإضافة أي أسئلة شائعة بعد.', buttonText: 'إضافة أول سؤال', buttonId: 'addFaqBtn' },
            'contact': { icon: 'fas fa-address-book', title: 'لا توجد قنوات تواصل', message: 'لم تقم بإضافة أي قنوات تواصل بعد.', buttonText: 'إضافة أول قناة', buttonId: 'addContactBtn' },
            'serv': { icon: 'fas fa-cogs', title: 'لا توجد خدمات', message: 'لم تقم بإضافة أي خدمات بعد.', buttonText: 'إضافة أول خدمة', buttonId: 'addServiceBtn' },
            'stats': { icon: 'fas fa-chart-bar', title: 'لا توجد إحصائيات', message: 'لم تقم بإضافة أي إحصائيات بعد.', buttonText: 'إضافة أول إحصائية', buttonId: 'addStatBtn' },
            'time': { icon: 'fas fa-tags', title: 'لا توجد عروض', message: 'لم تقم بإضافة أي عروض ترويجية بعد.', buttonText: 'إضافة أول عرض', buttonId: 'addCategoryPromoBtn' },
            'products': { icon: 'fas fa-box', title: 'لا توجد منتجات', message: 'لم تقم بإضافة أي منتجات بعد.', buttonText: 'إضافة أول منتج', buttonId: 'addProductBtn' },
            'categories': { icon: 'fas fa-folder', title: 'لا توجد أقسام', message: 'لم تقم بإضافة أي أقسام بعد.', buttonText: 'إضافة أول قسم', buttonId: 'addCategoryBtn' },
            'bot': { icon: 'fas fa-robot', title: 'لا توجد ردود', message: 'لم تقم بإضافة أي ردود للبوت بعد.', buttonText: 'إضافة أول رد', buttonId: 'addBotBtn' },
            'orders': { icon: 'fas fa-shopping-bag', title: 'لا توجد طلبات', message: 'لم يتم استلام أي طلبات حتى الآن.', showButton: false },
            'customer-messages': { icon: 'fas fa-comments', title: 'لا توجد رسائل', message: 'لم يتم استلام أي رسائل من العملاء حتى الآن.', showButton: false }
        };
    }

    createEmptyState(sectionId) {
        const config = this.sectionConfigs[sectionId];
        if (!config) return null;

        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state-container';
        emptyState.id = `${sectionId}NoResults`;
        
        emptyState.innerHTML = `
            <div class="empty-state-content">
                <div class="empty-state-icon">
                    <i class="${config.icon}"></i>
                </div>
                <h3 class="empty-state-title">${config.title}</h3>
                <p class="empty-state-message">${config.message}</p>
                ${config.showButton !== false ? `
                    <button class="empty-state-button" id="${sectionId}EmptyStateBtn">
                        <i class="fas fa-plus"></i>${config.buttonText}
                    </button>
                ` : ''}
            </div>
        `;

        return emptyState;
    }

    setupEmptyStateButton(sectionId) {
        const config = this.sectionConfigs[sectionId];
        if (!config || !config.buttonId) return;

        const emptyStateBtn = document.getElementById(`${sectionId}EmptyStateBtn`);
        const targetBtn = document.getElementById(config.buttonId);
        
        if (emptyStateBtn && targetBtn) {
            emptyStateBtn.addEventListener('click', () => {
                targetBtn.click();
            });
        }
    }

    showEmptyState(sectionId) {
        const grid = document.getElementById(`${sectionId}Grid`);
        const noResults = document.getElementById(`${sectionId}NoResults`);
        
        if (!grid) return;

        grid.style.display = 'none';
        
        let emptyState = noResults;
        if (!emptyState) {
            emptyState = this.createEmptyState(sectionId);
            if (emptyState) {
                grid.parentNode.insertBefore(emptyState, grid);
                this.setupEmptyStateButton(sectionId);
            }
        }
        
        if (emptyState) {
            emptyState.classList.add('show');
        }
    }

    hideEmptyState(sectionId) {
        const grid = document.getElementById(`${sectionId}Grid`);
        const emptyState = document.getElementById(`${sectionId}NoResults`);
        
        if (grid) grid.style.display = 'grid';
        if (emptyState) emptyState.classList.remove('show');
    }

    showSearchEmptyState(sectionId) {
        const emptyState = document.getElementById(`${sectionId}NoResults`);
        if (emptyState) {
            const title = emptyState.querySelector('.empty-state-title');
            const message = emptyState.querySelector('.empty-state-message');
            const icon = emptyState.querySelector('.empty-state-icon i');
            
            if (title) title.textContent = 'لا توجد نتائج';
            if (message) message.textContent = 'لم نعثر على أي عناصر تطابق بحثك.';
            if (icon) icon.className = 'fas fa-search';
            
            this.showEmptyState(sectionId);
        }
    }
}

const emptyStateManager = new UnifiedEmptyStateManager();

// ==================== نظام Cloudinary المحسن ====================
class CloudinaryManager {
    constructor() {
        this.cloudName = 'de3t3azua';
        this.uploadPreset = 'ml_default';
        this.uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/upload`;
        this.destroyUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`;
        this.concurrentUploads = 3;
    }

    async uploadImage(file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', this.uploadPreset);

        try {
            const response = await fetch(this.uploadUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('فشل رفع الصورة');

            const data = await response.json();
            return {
                url: data.secure_url,
                public_id: data.public_id,
                alt: `صورة ${file.name}`
            };
        } catch (error) {
            console.error('خطأ في رفع الصورة:', error);
            throw error;
        }
    }

    async deleteImage(publicId) {
        const params = new URLSearchParams();
        params.append('public_id', publicId);
        params.append('upload_preset', this.uploadPreset);

        try {
            await fetch(this.destroyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params
            });
        } catch (error) {
            console.error('خطأ في حذف الصورة:', error);
            throw error;
        }
    }

    async uploadMultipleImages(files) {
        const uploadPromises = [];
        const chunks = this.chunkArray(Array.from(files), this.concurrentUploads);
        
        for (const chunk of chunks) {
            const chunkPromises = chunk.map(file => this.uploadImage(file));
            const chunkResults = await Promise.allSettled(chunkPromises);
            uploadPromises.push(...chunkResults);
            // إضافة تأخير بسيط بين المجموعات
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return uploadPromises.map(result => 
            result.status === 'fulfilled' ? result.value : null
        ).filter(Boolean);
    }

    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    async deleteMultipleImages(images) {
        if (!images || images.length === 0) return;
        
        const deletePromises = images.map(img => 
            img.public_id ? this.deleteImage(img.public_id) : Promise.resolve()
        );
        
        return Promise.allSettled(deletePromises);
    }
}

const cloudinaryManager = new CloudinaryManager();

// ==================== نظام التنقل المحسن ====================
function setupNavigation() {
    const sections = document.querySelectorAll('.section-content');
    sections.forEach(section => {
        if (section.id !== 'dashboard') {
            section.style.display = 'none';
        }
    });

    setupNavigationEventListeners();
    setupMobileNavigation();
}

function setupNavigationEventListeners() {
    document.addEventListener('click', (e) => {
        const dashboardCard = e.target.closest('.dashboard-card');
        if (dashboardCard) {
            e.preventDefault();
            const targetSection = dashboardCard.dataset.section;
            showSection(targetSection);
        }

        const sidebarLink = e.target.closest('.sidebar-nav a');
        if (sidebarLink) {
            e.preventDefault();
            const targetSection = sidebarLink.dataset.section;
            showSection(targetSection);
            updateSidebarActiveState(targetSection);
        }

        const viewMoreBtn = e.target.closest('.view-more-btn');
        if (viewMoreBtn) {
            e.preventDefault();
            const targetSection = viewMoreBtn.dataset.section;
            showSection(targetSection);
        }
    });
}

function setupMobileNavigation() {
    const backToDashboardBtn = document.getElementById('backToDashboardBtn');
    if (backToDashboardBtn) {
        backToDashboardBtn.addEventListener('click', () => {
            showSection('dashboard');
        });
    }
}

function updateSidebarActiveState(activeSection) {
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
    sidebarLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === activeSection) {
            link.classList.add('active');
        }
    });
}


// دالة مستقلة لتحديث إشعارات الأقسام
function updateSectionNotifications() {
    const { ordersRef, messagesRef } = getFirebaseRefs();
    
    // تحديث إشعارات الطلبات
    const ordersQuery = query(ordersRef, limitToLast(100));
    onValue(ordersQuery, (snapshot) => {
        updateOrdersBadgeGlobal(snapshot.val() || {});
    }, { onlyOnce: true });

    // تحديث إشعارات الرسائل
    onValue(messagesRef, (snapshot) => {
        updateMessagesBadgeGlobal(snapshot.val() || {});
    }, { onlyOnce: true });
}

// دوال مستقلة لتحديث الإشعارات
function updateOrdersBadgeGlobal(orders) {
    let newOrdersCount = 0;
    
    Object.values(orders).forEach(order => {
        if (!order) return;
        
        const normalizedStatus = utils.normalizeOrderStatus(order);
        if (normalizedStatus === 'new') {
            newOrdersCount++;
        }   
    });

    const badges = [
        document.getElementById('ordersBadgeDesktop'),
        document.getElementById('ordersBadgeMobile')
    ];

    badges.forEach(badge => {
        if (badge) {
            if (newOrdersCount > 0) {
                badge.textContent = newOrdersCount > 99 ? '99+' : newOrdersCount;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    });

    // تحديث الإشعار في الكرة إذا كان الطلبات هو القسم النشط
    const activeSection = document.querySelector('.section-content.active');
    if (activeSection && activeSection.id === 'orders') {
        const dotElement = document.querySelector('.gbc-animated-menu-bar > div:first-child');
        const dotBadge = dotElement.querySelector('.notification-badge');
        
        if (newOrdersCount > 0) {
            if (!dotBadge) {
                const newBadge = document.createElement('span');
                newBadge.className = 'notification-badge';
                newBadge.textContent = newOrdersCount > 99 ? '99+' : newOrdersCount;
                newBadge.style.cssText = 'position: absolute; top: -5px; right: -5px; background: #e74c3c; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.2); z-index: 10000;';
                dotElement.appendChild(newBadge);
            } else {
                dotBadge.textContent = newOrdersCount > 99 ? '99+' : newOrdersCount;
            }
        } else if (dotBadge) {
            dotBadge.remove();
        }
    }

    // تحديث العداد في الصفحة الرئيسية
    const newOrdersElement = document.getElementById('newOrdersCount');
    if (newOrdersElement) {
        newOrdersElement.textContent = newOrdersCount;
    }
}

function updateMessagesBadgeGlobal(messages) {
    let newMessagesCount = 0;
    Object.values(messages).forEach(message => {
        if (message.status === 'new') newMessagesCount++;
    });

    const badges = [
        document.getElementById('messagesBadgeDesktop'),
        document.getElementById('messagesBadgeMobile')
    ];

    badges.forEach(badge => {
        if (badge) {
            if (newMessagesCount > 0) {
                badge.textContent = newMessagesCount > 99 ? '99+' : newMessagesCount;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    });

    // تحديث الإشعار في الكرة إذا كان الرسائل هو القسم النشط
    const activeSection = document.querySelector('.section-content.active');
    if (activeSection && activeSection.id === 'customer-messages') {
        const dotElement = document.querySelector('.gbc-animated-menu-bar > div:first-child');
        const dotBadge = dotElement.querySelector('.notification-badge');
        
        if (newMessagesCount > 0) {
            if (!dotBadge) {
                const newBadge = document.createElement('span');
                newBadge.className = 'notification-badge';
                newBadge.textContent = newMessagesCount > 99 ? '99+' : newMessagesCount;
                newBadge.style.cssText = 'position: absolute; top: -5px; right: -5px; background: #e74c3c; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.2); z-index: 10000;';
                dotElement.appendChild(newBadge);
            } else {
                dotBadge.textContent = newMessagesCount > 99 ? '99+' : newMessagesCount;
            }
        } else if (dotBadge) {
            dotBadge.remove();
        }
    }
}

function showSection(sectionId) {
    const activeElement = document.activeElement;
    
    const sections = document.querySelectorAll('.section-content');
    sections.forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active');
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('active');
        
        setTimeout(() => {
            if (activeElement && targetSection.contains(activeElement)) {
                activeElement.focus();
            }
        }, 100);
    }

    window.scrollTo(0, 0);
    updateSectionTitle(sectionId);

    const backToDashboardBtn = document.getElementById('backToDashboardBtn');
    if (backToDashboardBtn) {
        if (sectionId === 'dashboard') {
            backToDashboardBtn.style.display = 'none';
        } else {
            backToDashboardBtn.style.display = 'block';
        }
    }

    updateSidebarActiveState(sectionId);

    const bodyClassList = document.body.classList;
    for (let i = 0; i < bodyClassList.length; i++) {
        const className = bodyClassList[i];
        if (className.startsWith('section-')) {
            bodyClassList.remove(className);
        }
    }
    bodyClassList.add(`section-${sectionId}`);
    
    updateActiveNavButton(sectionId);
    loadSectionData(sectionId);
    
    // تحديث الإشعارات عند تغيير القسم
    setTimeout(() => {
      updateSectionNotifications();
    }, 100);

    setTimeout(() => {
        const grid = document.getElementById(`${sectionId}Grid`);
        if (grid && grid.children.length === 0) {
            emptyStateManager.showEmptyState(sectionId);
        }
    }, 100);
}

async function loadSectionData(sectionId) {
    const sectionInitializers = {
        'welcome': initWelcomeSection,
        'faq': initFAQSection,
        'contact': initContactSection,
        'serv': initServicesSection,
        'stats': initStatsSection,
        'time': initPromoSection,
        'who': initAboutSection,
        'products': initProductsSection,
        'orders': initOrdersSection,
        'categories': initCategoriesSection,
        'bot': initBotSection,
        'customer-messages': initCustomerMessagesSection
    };

    const initializer = sectionInitializers[sectionId];
    if (initializer && !appState.isSectionInitialized(sectionId)) {
        try {
            await initializer();
            appState.markSectionInitialized(sectionId);
        } catch (error) {
            console.error(`خطأ في تحميل قسم ${sectionId}:`, error);
            utils.showToast(`حدث خطأ في تحميل القسم: ${sectionId}`, 'error');
        }
    }
}

function updateSectionTitle(sectionId) {
    const sectionTitles = {
        'dashboard': 'لوحة القيادة',
        'welcome': 'رسالة الترحيب',
        'faq': 'سؤال وجواب',
        'contact': 'التواصل',
        'serv': 'الخدمات',
        'stats': 'الإحصائيات',
        'time': 'العروض',
        'who': 'من نحن',
        'products': 'المنتجات',
        'customer-messages': 'رسائل العملاء',
        'orders': 'الطلبات',
        'categories': 'الأقسام',
        'bot': 'البوت'
    };

    const titleElement = document.getElementById('currentSectionTitle');
    if (titleElement) {
        titleElement.textContent = sectionId === 'dashboard' 
            ? 'لوحة تحكم المتجر' 
            : 'إدارة ' + (sectionTitles[sectionId] || sectionId);
    }
}

function updateActiveNavButton(sectionId) {
    try {
        const navButtons = document.querySelectorAll('.gbc-animated-menu-bar button');
        const dotElement = document.querySelector('.gbc-animated-menu-bar > div:first-child');
        
        if (!dotElement) {
            console.warn('عنصر النقطة غير موجود');
            return;
        }
        
        // إزالة أي إشعارات سابقة من الكرة بشكل آمن
        const existingDotBadges = dotElement.querySelectorAll('.notification-badge');
        if (existingDotBadges) {
            existingDotBadges.forEach(badge => {
                if (badge && badge.parentNode) {
                    badge.remove();
                }
            });
        }
        
        navButtons.forEach(button => {
            if (!button) return;
            
            const buttonSection = button.dataset.section;
            const icon = button.querySelector('.material-symbols-outlined');
            const title = button.querySelector('.button-title');
            const badge = button.querySelector('.notification-badge');

            if (!icon || !title) return;

            if (buttonSection === sectionId) {
                // إخفاء أيقونة وعنوان الزر المحدد
                icon.classList.add('hidden-icon');
                title.classList.add('hidden-title');

                // حساب الموضع الجديد للنقطة بشكل آمن
                try {
                    const buttonRect = button.getBoundingClientRect();
                    const containerRect = button.parentElement.getBoundingClientRect();
                    const left = buttonRect.left - containerRect.left + (buttonRect.width / 2) - 30;
                    
                    dotElement.style.left = `${left}px`;

                    // تحديث موضع القناع
                    const maskDiv = document.querySelector('.gbc-animated-menu-bar > div:last-child');
                    if (maskDiv) {
                        const maskOffset = left - 2016;
                        maskDiv.style.setProperty("-webkit-mask-position-x", `${maskOffset}px`);
                    }

                    // تحديث الأيقونة في النقطة
                    const dotIcon = dotElement.querySelector('span');
                    if (dotIcon) {
                        dotIcon.textContent = icon.textContent;
                    }
                } catch (error) {
                    console.warn('خطأ في حساب موضع النقطة:', error);
                }

                // نقل الإشعار إلى الكرة إذا كان موجوداً ومفعل
                if (badge && badge.style.display !== 'none' && badge.textContent !== '0' && badge.textContent !== '') {
                    try {
                        const badgeClone = badge.cloneNode(true);
                        
                        dotElement.appendChild(badgeClone);
                        
                        // إخفاء الإشعار الأصلي ولكن الحفاظ عليه في DOM
                        badge.style.visibility = 'hidden';
                    } catch (error) {
                        console.warn('خطأ في نسخ الإشعار:', error);
                    }
                }
            } else {
                // إظهار أيقونات الأزرار غير النشطة
                icon.classList.remove('hidden-icon');
                title.classList.remove('hidden-title');
                
                // إعادة إظهار الإشعار الأصلي إذا كان مخفياً
                if (badge) {
                    badge.style.visibility = 'visible';
                }
            }
        });
    } catch (error) {
        console.error('خطأ في updateActiveNavButton:', error);
    }
}

// ==================== شريط التنقل المتحرك ====================
class AnimatedMobileMenu {
    constructor() {
        this.buttons = document.querySelectorAll('.gbc-animated-menu-bar button');
        this.dot = document.querySelector('.gbc-animated-menu-bar > div:first-child');
        this.maskDiv = document.querySelector('.gbc-animated-menu-bar > div:last-child');
        this.selectedIndex = 2;
        this.lastMenuTarget = null;
        this.timeouts = {};

        this.init();
    }

    init() {
        this.buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.menuButtonClicked(e.currentTarget);
            });
        });

        this.menuButtonClicked(this.buttons[this.selectedIndex]);

        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.menuButtonClicked(this.buttons[this.selectedIndex]);
            }, 100);
        });
    }

    menuButtonClicked(target) {
        // منع السلوك الافتراضي
        event.preventDefault();
        event.stopPropagation();
           
        const sectionId = target.dataset.section;
           
        // التأكد من أن القسم موجود قبل التبديل
        const targetSection = document.getElementById(sectionId);
        if (!targetSection) {
            console.error('القسم غير موجود:', sectionId);
            return;
        }
           
        showSection(sectionId);
        // إزالة التحديد السابق
        if (this.lastMenuTarget) {
            this.lastMenuTarget.querySelector('.material-symbols-outlined').classList.remove('hidden-icon');
            this.lastMenuTarget.querySelector('.button-title').classList.remove('hidden-title');
        }
       
        // إخفاء أيقونة الزر المحدد
        target.querySelector('.material-symbols-outlined').classList.add('hidden-icon');
        target.querySelector('.button-title').classList.add('hidden-title');
       
        // حساب الموضع الجديد للنقطة
        const buttonRect = target.getBoundingClientRect();
        const containerRect = this.dot.parentElement.getBoundingClientRect();
        const left = buttonRect.left - containerRect.left + (buttonRect.width / 2) - (this.dot.offsetWidth / 2);
           
        this.dot.style.left = `${left}px`;
       
        // تحديث موضع القناع
        const maskOffset = left - 2016;
        this.maskDiv.style.setProperty("-webkit-mask-position-x", `${maskOffset}px`);
        this.reApplyClass(this.maskDiv, "mask-bounce", 500);
       
        // تحديث الأيقونة في النقطة
        const icon = target.querySelector('.material-symbols-outlined').innerText;
        this.dot.querySelector('span').innerText = icon;
       
        this.lastMenuTarget = target;
       
        // تشغيل تأثير الحركة
        this.reApplyClass(this.dot, "moving", 500);
       
        // تحديث الفهرس المحدد
        this.selectedIndex = parseInt(target.getAttribute('data-index'));
    }

    reApplyClass(target, className, duration) {
        target.classList.remove(className);
        setTimeout(() => target.classList.add(className));
        clearTimeout(this.timeouts[className]);
        this.timeouts[className] = setTimeout(() => target.classList.remove(className), duration);
    }
}

// ==================== نظام الثيم ====================
function setupTheme() {
    const savedTheme = localStorage.getItem('theme');
    const isLight = savedTheme === 'light';
    
    if (isLight) {
        document.body.classList.add('theme-light');
    }
    
    document.querySelectorAll('#themeToggleDesktop i, #themeToggleMobile i').forEach(icon => {
        if (icon) {
            icon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
        }
    });

    setupThemeEventListeners();
}

function setupThemeEventListeners() {
    const themeToggles = [
        document.getElementById('themeToggleDesktop'),
        document.getElementById('themeToggleMobile')
    ];

    themeToggles.forEach(toggle => {
        if (toggle) {
            toggle.addEventListener('click', function() {
                const body = document.body;
                const isLight = body.classList.toggle('theme-light');
                const theme = isLight ? 'light' : 'dark';
                
                localStorage.setItem('theme', theme);
                
                const icon = this.querySelector('i');
                if (icon) {
                    icon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
                }
            });
        }
    });
}

// ==================== نظام الأيقونات ====================
function setupIconPickers() {
    // سيتم تحميلها عند الحاجة
}

function createIconGrid(selectedIcon = 'fas fa-question') {
    const icons = [
        'fas fa-home', 'fas fa-store', 'fas fa-shopping-cart', 'fas fa-shopping-bag',
        'fas fa-tag', 'fas fa-tags', 'fas fa-box', 'fas fa-boxes', 'fas fa-pallet',
        'fas fa-gift', 'fas fa-gifts', 'fas fa-star', 'fas fa-heart', 'fas fa-certificate',
        'fas fa-mobile-alt', 'fas fa-laptop', 'fas fa-tablet-alt', 'fas fa-headphones',
        'fas fa-tv', 'fas fa-camera', 'fas fa-gamepad', 'fas fa-clock', 'fas fa-watch',
        'fas fa-tshirt', 'fas fa-socks', 'fas fa-shoe-prints', 'fas fa-ring',
        'fas fa-gem', 'fas fa-glasses', 'fas fa-hat-cowboy', 'fas fa-vest',
        'fas fa-couch', 'fas fa-chair', 'fas fa-bed', 'fas fa-blender', 'fas fa-utensils',
        'fas fa-utensil-spoon', 'fas fa-mug-hot', 'fas fa-pizza-slice', 'fas fa-ice-cream',
        'fas fa-heartbeat', 'fas fa-pills', 'fas fa-briefcase-medical', 'fas fa-spa',
        'fas fa-soap', 'fas fa-pump-soap', 'fas fa-hand-sparkles', 'fas fa-user-md',
        'fas fa-football-ball', 'fas fa-basketball-ball', 'fas fa-baseball-ball',
        'fas fa-running', 'fas fa-bicycle', 'fas fa-swimmer', 'fas fa-dumbbell',
        'fas fa-car', 'fas fa-motorcycle', 'fas fa-bicycle', 'fas fa-truck',
        'fas fa-truck-pickup', 'fas fa-gas-pump', 'fas fa-key', 'fas fa-tools',
        'fas fa-book', 'fas fa-book-open', 'fas fa-graduation-cap', 'fas fa-pencil-alt',
        'fas fa-marker', 'fas fa-highlighter', 'fas fa-backpack', 'fas fa-school',
        'fas fa-baby', 'fas fa-child', 'fas fa-robot', 'fas fa-puzzle-piece',
        'fas fa-teddy-bear', 'fas fa-rocket', 'fas fa-lemon', 'fas fa-snowman',
        'fas fa-paw', 'fas fa-cat', 'fas fa-dog', 'fas fa-fish', 'fas fa-kiwi-bird',
        'fas fa-hammer', 'fas fa-wrench', 'fas fa-screwdriver', 'fas fa-ruler',
        'fas fa-paint-roller', 'fas fa-brush', 'fas fa-toolbox', 'fas fa-hard-hat',
        'fas fa-apple-alt', 'fas fa-lemon', 'fas fa-pepper-hot', 'fas fa-cheese',
        'fas fa-bread-slice', 'fas fa-wine-bottle', 'fas fa-beer', 'fas fa-coffee',
        'fas fa-plane', 'fas fa-suitcase', 'fas fa-suitcase-rolling', 'fas fa-passport',
        'fas fa-map', 'fas fa-map-marked-alt', 'fas fa-globe-americas', 'fas fa-umbrella-beach',
        'fas fa-money-bill-wave', 'fas fa-credit-card', 'fas fa-receipt', 'fas fa-calculator',
        'fas fa-chart-line', 'fas fa-chart-bar', 'fas fa-briefcase', 'fas fa-building',
        'fas fa-tree', 'fas fa-leaf', 'fas fa-seedling', 'fas fa-mountain',
        'fas fa-water', 'fas fa-fire', 'fas fa-sun', 'fas fa-moon',
        'fas fa-question', 'fas fa-info', 'fas fa-exclamation', 'fas fa-check',
        'fas fa-times', 'fas fa-cog', 'fas fa-sliders-h', 'fas fa-filter'
    ];

    return createGenericIconGrid(icons, selectedIcon);
}

function createContactIconGrid(selectedIcon = 'fab fa-whatsapp') {
    const contactIcons = [
        'fab fa-whatsapp', 'fab fa-facebook', 'fab fa-facebook-messenger', 'fab fa-instagram',
        'fab fa-twitter', 'fab fa-linkedin', 'fab fa-youtube', 'fab fa-telegram',
        'fab fa-snapchat', 'fab fa-tiktok', 'fas fa-phone', 'fas fa-envelope',
        'fas fa-globe', 'fas fa-link', 'fas fa-map-marker-alt', 'fas fa-store','fab fa-google'
    ];

    return createGenericIconGrid(contactIcons, selectedIcon);
}

function createGenericIconGrid(icons, selectedIcon) {
    const container = document.createElement('div');
    container.className = 'icon-grid';

    let selected = selectedIcon;

    icons.forEach(icon => {
        const iconEl = document.createElement('div');
        iconEl.className = `icon-option ${icon === selected ? 'selected' : ''}`;
        iconEl.innerHTML = `<i class="${icon}"></i>`;
        iconEl.title = icon;
        iconEl.addEventListener('click', () => {
            container.querySelectorAll('.icon-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            iconEl.classList.add('selected');
            selected = icon;
        });
        container.appendChild(iconEl);
    });

    return { container, getSelectedIcon: () => selected };
}

// ==================== لوحة القيادة المحسنة ====================
function initWelcomeDashboard() {
    updateDashboardStats();
    
    const revenueFilter = document.getElementById('revenueFilter');
    if (revenueFilter) {
        revenueFilter.value = 'all';
        updateRevenueStats('all');
        revenueFilter.addEventListener('change', function() {
            updateRevenueStats(this.value);
        });
    }
}

function updateDashboardStats() {
    const { ordersRef, messagesRef, productsRef } = getFirebaseRefs();
    
    const ordersQuery = query(ordersRef, limitToLast(500));
    
    onValue(ordersQuery, (snapshot) => {
        const orders = snapshot.val() || {};
        let newOrdersCount = 0;

        // استخدام نفس منطق تطبيع الحالة الموحد
        Object.values(orders).forEach(order => {
            if (!order) return;
            
            const normalizedStatus = utils.normalizeOrderStatus(order);
            if (normalizedStatus === 'new') {
                newOrdersCount++;
            }
        });

        const newOrdersElement = document.getElementById('newOrdersCount');
        if (newOrdersElement) {
            newOrdersElement.textContent = newOrdersCount;
        }
    });

    // باقي الكود كما هو...
    onValue(messagesRef, (snapshot) => {
        const messages = snapshot.val() || {};
        let newMessagesCount = 0;

        Object.values(messages).forEach(message => {
            if (message.status === 'new') newMessagesCount++;
        });

        const newMessagesElement = document.getElementById('newMessagesCount');
        if (newMessagesElement) {
            newMessagesElement.textContent = newMessagesCount;
        }
    });

    // تحميل عدد المنتجات الحالية
    updateProductsCount();
    updateRevenueStats('today');
}

function updateProductsCount() {
    const { productsRef } = getFirebaseRefs();
    
    onValue(productsRef, (snapshot) => {
        const products = snapshot.val() || {};
        let availableProductsCount = 0;

        // حساب عدد المنتجات المتاحة (الكمية أكبر من 0)
        Object.values(products).forEach(product => {
            if (product.quantity > 0) {
                availableProductsCount++;
            }
        });

        const productsCountElement = document.getElementById('currentProductsCount');
        if (productsCountElement) {
            productsCountElement.textContent = availableProductsCount;
        }
    });
}

function updateRevenueStats(period) {
    const { ordersRef } = getFirebaseRefs();
    
    const ordersQuery = query(ordersRef, limitToLast(500));
    
    onValue(ordersQuery, (snapshot) => {
        const orders = snapshot.val() || {};
        let totalRevenue = 0;
        const now = new Date();
        
        Object.values(orders).forEach(order => {
            if (order.status === 'completed') {
                const orderDate = new Date(order.timestamp);
                let includeOrder = false;
                
                if (period === 'all') {
                    includeOrder = true;
                } else if (period === 'today') {
                    includeOrder = orderDate.toDateString() === now.toDateString();
                } else if (period === 'month') {
                    includeOrder = orderDate.getMonth() === now.getMonth() && 
                                 orderDate.getFullYear() === now.getFullYear();
                } else if (period === 'year') {
                    includeOrder = orderDate.getFullYear() === now.getFullYear();
                }
                
                if (includeOrder) {
                    totalRevenue += order.total || 0;
                }
            }
        });
        
        const revenueElement = document.getElementById('revenueAmount');
        if (revenueElement) {
            revenueElement.textContent = totalRevenue.toLocaleString();
        }
    });
}

// ==================== قسم رسالة الترحيب ====================
function initWelcomeSection() {
    const { welcomeRef } = getFirebaseRefs();
    const textareaAr = document.getElementById('welcomeTextAr');
    const textareaEn = document.getElementById('welcomeTextEn');
    const form = document.getElementById('welcomeForm');

    if (!textareaAr || !textareaEn || !form) return;

    onValue(welcomeRef, snap => {
        const obj = snap.val() || {};
        textareaAr.value = obj.ar || '';
        textareaEn.value = obj.en || '';
    });

    form.addEventListener('submit', e => {
        e.preventDefault();
        const ar = textareaAr.value.trim();
        const en = textareaEn.value.trim();

         set(welcomeRef, { ar, en })
            .then(() => utils.showToast('تم تحديث رسالة الترحيب بنجاح'))
            .catch(err => utils.showToast('خطأ أثناء الحفظ: ' + err.message, 'error'));
    });
}

// ==================== قسم سؤال وجواب ====================
function initFAQSection() {
    const { faqRef } = getFirebaseRefs();
    const faqGrid = document.getElementById('faqGrid');
    const searchInput = document.getElementById('faqSearch');
    const searchBtn = document.getElementById('faqSearchBtn');
    const modalRoot = document.getElementById('faqModalRoot');
    const addFaqBtn = document.getElementById('addFaqBtn');
    
    if (!faqGrid || !addFaqBtn) return;
    
    let currentFaqKey = null;
    let faqsData = {};
    let searchQuery = '';

    // عرض الأسئلة في الشبكة
    function renderFaqsGrid() {
        try {
            faqGrid.innerHTML = '';
            
        if (Object.keys(faqsData).length === 0) {
            emptyStateManager.showEmptyState('faq');
            return;
        }
        
        const filteredFaqs = utils.searchData(faqsData, searchQuery, ['question.ar', 'question.en', 'answer.ar', 'answer.en']);
        
        if (filteredFaqs.length === 0) {
            emptyStateManager.showSearchEmptyState('faq');
            return;
        } else {
            emptyStateManager.hideEmptyState('faq');
        }
            
            filteredFaqs.sort(([, a], [, b]) => (a.order || 0) - (b.order || 0));
            
            utils.renderChunked(filteredFaqs, faqGrid, ([key, faq]) => {
                const card = document.createElement('div');
                card.className = 'grid-card';
                card.dataset.id = key;
                
                card.innerHTML = `
                    <div class="grid-meta">
                        <div style="min-width:0">
                            <h3>${faq.question?.ar || 'بدون سؤال'}</h3>
                            <small class="muted">${faq.question?.en || 'No question'}</small>
                        </div>
                    </div>
                    <div class="grid-meta">
                        <div>
                            <span class="order-badge"><i class="fas fa-sort"></i>الترتيب = ${faq.order || 0}</span>
                        </div>
                        <div class="icon-badge" style="background: ${faq.color || '#3498db'};">
                            <i class="${faq.icon || 'fas fa-question'}"></i>
                        </div>
                    </div>
                    <div class="grid-actions">
                        <button class="grid-btn edit"><i class="fas fa-edit"></i> تعديل</button>
                        <button class="grid-btn danger del"><i class="fas fa-trash"></i> حذف </button>
                    </div>
                `;
                
                card.querySelector('.edit').addEventListener('click', () => editFaq(key));
                card.querySelector('.del').addEventListener('click', () => deleteFaq(key));
                
                return card;
            });
            
        } catch (error) {
            console.error('خطأ في عرض الأسئلة:', error);
            utils.showToast('حدث خطأ أثناء تحميل البيانات', 'error');
        }
    }

    // فتح نافذة إضافة/تعديل السؤال
    function openFaqModal(key = null, faq = null) {
        const isNew = key === null;
        if (!modalRoot) return;
        
        modalRoot.style.display = 'block';
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        modal.innerHTML = `
            <div class="modal-content-new" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
                ${utils.createModalHeader(isNew ? 'إضافة سؤال' : 'تعديل سؤال')}
                
                <form id="editFaqForm">
                    <div class="form-compact-new">
                        <div>
                            <label>السؤال (عربي) *</label>
                            <input name="question_ar" value="${isNew ? '' : utils.escapeHtml(faq.question?.ar || '')}" required>
                        </div>
                        <div>
                            <label>السؤال (إنجليزي) *</label>
                            <input name="question_en" value="${isNew ? '' : utils.escapeHtml(faq.question?.en || '')}" required>
                        </div>

                        <div class="full">
                            <label>الإجابة (عربي)</label>
                            <textarea name="answer_ar">${isNew ? '' : utils.escapeHtml(faq.answer?.ar || '')}</textarea>
                        </div>
                        <div class="full">
                            <label>الإجابة (إنجليزي)</label>
                            <textarea name="answer_en">${isNew ? '' : utils.escapeHtml(faq.answer?.en || '')}</textarea>
                        </div>

                        <div class="full">
                            <label>الأيقونة</label>
                            <div id="iconGridContainer"></div>
                        </div>

                        <div>
                            <label>لون العرض</label>
                            <input type="color" name="color" value="${isNew ? '#3498db' : faq.color || '#3498db'}">
                        </div>

                        <div>
                            <label>ترتيب العرض</label>
                            <input type="number" name="order" value="${isNew ? '1' : faq.order || 1}" min="0">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="grid-btn save">
                            <i class="fas fa-save"></i> ${isNew ? 'إضافة' : 'حفظ'}
                        </button>
                        <button type="button" class="grid-btn close">إلغاء</button>
                    </div>
                </form>
            </div>
        `;

        // إضافة شبكة الأيقونات
        const iconGridContainer = modal.querySelector('#iconGridContainer');
        const initialIcon = isNew ? 'fas fa-question' : (faq.icon || 'fas fa-question');
        const { container: iconGrid, getSelectedIcon } = createIconGrid(initialIcon);
        iconGridContainer.appendChild(iconGrid);

        // إضافة المستمعين للأحداث
        modal.querySelector('.modal-close-unified').addEventListener('click', () => {
        modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                modalRoot.style.display = 'none';
            }, 300);
        });

        // حفظ التعديلات
        modal.querySelector('.save').addEventListener('click', async () => {
            const form = modal.querySelector('#editFaqForm');
            const fd = new FormData(form);

            // التحقق من الحقول المطلوبة
            if (!fd.get('question_ar') || !fd.get('question_en')) {
                utils.showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
                return;
            }

            const faqData = {
                question: {
                    ar: fd.get('question_ar') || '',
                    en: fd.get('question_en') || ''
                },
                answer: {
                    ar: fd.get('answer_ar') || '',
                    en: fd.get('answer_en') || ''
                },
                icon: getSelectedIcon(),
                color: fd.get('color') || '#3498db',
                order: parseInt(fd.get('order')) || 1
            };
            
            try {
                if (isNew) {
                    await push(faqRef, faqData);
                    utils.showToast('تم إضافة السؤال بنجاح');
                } else {
                    await update(child(faqRef, key), faqData);
                    utils.showToast('تم حفظ التعديلات بنجاح');
                }
                
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.remove();
                    modalRoot.style.display = 'none';
                }, 300);
            } catch (error) {
                console.error('خطأ في الحفظ:', error);
                utils.showToast('حدث خطأ أثناء الحفظ: ' + error.message, 'error');
            }
        });

        modalRoot.innerHTML = '';
        modalRoot.appendChild(modal);
        utils.setupModalClose(modal, modalRoot);
    }

    // تعديل سؤال
    async function editFaq(key) {
        try {
            const snap = await get(child(faqRef, key));
            const faq = snap.val();
            openFaqModal(key, faq);
        } catch (error) {
            console.error('خطأ في تحرير السؤال:', error);
            utils.showToast('حدث خطأ أثناء تحميل بيانات السؤال', 'error');
        }
    }

    // حذف سؤال
    async function deleteFaq(key) {
        if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
        
        try {
            await remove(child(faqRef, key));
            utils.showToast('تم حذف السؤال بنجاح');
        } catch (error) {
            console.error('خطأ في الحذف:', error);
            utils.showToast('حدث خطأ أثناء الحذف: ' + error.message, 'error');
        }
    }

    // البحث - يعمل عند الضغط على زر البحث فقط
    function performSearch() {
        searchQuery = searchInput.value.trim();
        renderFaqsGrid();
    }

    // إعداد مستمعي الأحداث
    function setupEventListeners() {
        // البحث عند الضغط على زر البحث فقط
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', performSearch);
        }

        // إضافة سؤال جديد
        addFaqBtn.addEventListener('click', () => {
            openFaqModal();
        });
    }

    // التهيئة الرئيسية
    function initialize() {
        setupEventListeners();
        
        // تحميل البيانات والاستماع للتحديثات في الوقت الحقيقي
        onValue(faqRef, (snapshot) => {
            faqsData = snapshot.val() || {};
            renderFaqsGrid();
        });

        // التهيئة الأولية للعرض
        renderFaqsGrid();
    }

    // بدء التهيئة
    initialize();
}
// ==================== قسم التواصل ====================
function initContactSection() {
    const { contactRef } = getFirebaseRefs();
    const contactGrid = document.getElementById('contactGrid');
    const searchInput = document.getElementById('contactSearch');
    const searchBtn = document.getElementById('contactSearchBtn');
    const modalRoot = document.getElementById('contactModalRoot');
    const addContactBtn = document.getElementById('addContactBtn');
    
    if (!contactGrid || !addContactBtn) return;
    
    let contactsData = {};
    let searchQuery = '';

    // عرض قنوات التواصل في الشبكة
    function renderContactsGrid() {
        try {
            contactGrid.innerHTML = '';
            
            if (Object.keys(contactsData).length === 0) {
                emptyStateManager.showEmptyState('contact');
                return;
            }
            
            // إذا كان البحث فارغاً، عرض جميع العناصر
            let filteredContacts = Object.entries(contactsData);
            
            if (searchQuery) {
                filteredContacts = utils.searchData(
                    contactsData,
                    searchQuery,
                    ['name.ar', 'name.en', 'link']
                );
            }
            
            if (filteredContacts.length === 0) {
                emptyStateManager.showSearchEmptyState('contact');
                return;
            } else {
                emptyStateManager.hideEmptyState('contact');
            }
            
            // ترتيب العناصر حسب الترتيب
            filteredContacts.sort(([, a], [, b]) => (a.order || 0) - (b.order || 0));
            
            // عرض العناصر
            filteredContacts.forEach(([key, contact]) => {
                const card = createContactCard(key, contact);
                contactGrid.appendChild(card);
            });
            
        } catch (error) {
            console.error('خطأ في عرض قنوات التواصل:', error);
            utils.showToast('حدث خطأ أثناء تحميل البيانات', 'error');
        }
    }

    // إنشاء بطاقة قناة التواصل
    function createContactCard(key, contact) {
        const card = document.createElement('div');
        card.className = 'grid-card';
        card.dataset.id = key;
        
        card.innerHTML = `
            <div class="grid-meta">
                <div style="min-width:0">
                    <h3>${contact.name?.ar || 'بدون اسم'}</h3>
                    <small class="muted">${contact.name?.en || 'No name'}</small>
                </div>
            </div>
            <div class="grid-meta">
                <div>
                    <span class="order-badge"><i class="fas fa-sort"></i> الترتيب =${contact.order || 0}</span>
                </div>
                <div class="icon-badge" style="background: #1e90ff;">
                    <i class="${contact.icon || 'fas fa-link'}"></i>
                </div>
            </div>
            <div class="grid-actions">
                <button class="grid-btn edit"><i class="fas fa-edit"></i> تعديل</button>
                <button class="grid-btn danger del"><i class="fas fa-trash"></i> حذف </button>
            </div>
        `;
        
        // إضافة مستمعي الأحداث
        card.querySelector('.edit').addEventListener('click', (e) => {
            e.stopPropagation();
            editContact(key);
        });
        
        card.querySelector('.del').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteContact(key);
        });
        
        return card;
    }

    // فتح نافذة إضافة/تعديل قناة التواصل
    function openContactModal(key = null, contact = null) {
        const isNew = key === null;
        if (!modalRoot) return;
        
        modalRoot.style.display = 'block';
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        modal.innerHTML = `
            <div class="modal-content-new" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
                ${utils.createModalHeader(isNew ? 'إضافة قناة تواصل' : 'تعديل قناة تواصل')}
                
                <form id="editContactForm">
                    <div class="form-compact-new">
                        <div>
                            <label>الاسم (عربي) *</label>
                            <input name="name_ar" value="${isNew ? '' : utils.escapeHtml(contact.name?.ar || '')}" required>
                        </div>
                        <div>
                            <label>الاسم (إنجليزي) *</label>
                            <input name="name_en" value="${isNew ? '' : utils.escapeHtml(contact.name?.en || '')}" required>
                        </div>

                        <div class="full">
                            <label>الرابط *</label>
                            <input type="url" name="link" value="${isNew ? '' : utils.escapeHtml(contact.link || '')}" required>
                        </div>

                        <div class="full">
                            <label>الأيقونة</label>
                            <div id="contactIconGridContainer"></div>
                        </div>

                        <div>
                            <label>ترتيب العرض</label>
                            <input type="number" name="order" value="${isNew ? '1' : contact.order || 1}" min="0">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="grid-btn save">
                            <i class="fas fa-save"></i> ${isNew ? 'إضافة' : 'حفظ'}
                        </button>
                        <button type="button" class="grid-btn close">إلغاء</button>
                    </div>
                </form>
            </div>
        `;

        // إضافة شبكة أيقونات التواصل
        const iconGridContainer = modal.querySelector('#contactIconGridContainer');
        const initialIcon = isNew ? 'fab fa-whatsapp' : (contact.icon || 'fab fa-whatsapp');
        const { container: iconGrid, getSelectedIcon } = createContactIconGrid(initialIcon);
        iconGridContainer.appendChild(iconGrid);

        // إضافة المستمعين للأحداث
        modal.querySelector('.modal-close-unified').addEventListener('click', () => {
        modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                modalRoot.style.display = 'none';
            }, 300);
        });

        // حفظ التعديلات
        modal.querySelector('.save').addEventListener('click', async () => {
            await handleContactSave(modal, key, isNew, getSelectedIcon);
        });

        modalRoot.innerHTML = '';
        modalRoot.appendChild(modal);
        utils.setupModalClose(modal, modalRoot);
    }

    // معالجة حفظ قناة التواصل
    async function handleContactSave(modal, key, isNew, getSelectedIcon) {
        const form = modal.querySelector('#editContactForm');
        const fd = new FormData(form);

        // التحقق من الحقول المطلوبة
        if (!fd.get('name_ar') || !fd.get('name_en') || !fd.get('link')) {
            utils.showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        const contactData = {
            name: {
                ar: fd.get('name_ar') || '',
                en: fd.get('name_en') || ''
            },
            link: fd.get('link') || '',
            icon: getSelectedIcon(),
            order: parseInt(fd.get('order')) || 1
        };
        
        try {
            if (isNew) {
                await push(contactRef, contactData);
                utils.showToast('تم إضافة قناة التواصل بنجاح');
            } else {
                await update(child(contactRef, key), contactData);
                utils.showToast('تم حفظ التعديلات بنجاح');
            }
            
            closeModal(modal);
            // لا حاجة لـ renderContactsGrid() هنا لأن البيانات ستتحدث تلقائياً عبر onValue
        } catch (error) {
            console.error('خطأ في الحفظ:', error);
            utils.showToast('حدث خطأ أثناء الحفظ: ' + error.message, 'error');
        }
    }

    // إغلاق المودال
    function closeModal(modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.remove();
            modalRoot.style.display = 'none';
        }, 300);
    }

    // تعديل قناة التواصل
    async function editContact(key) {
        try {
            const snap = await get(child(contactRef, key));
            const contact = snap.val();
            openContactModal(key, contact);
        } catch (error) {
            console.error('خطأ في تحرير قناة التواصل:', error);
            utils.showToast('حدث خطأ أثناء تحميل بيانات قناة التواصل', 'error');
        }
    }

    // حذف قناة التواصل
    async function deleteContact(key) {
        if (!confirm('هل أنت متأكد من حذف هذه القناة؟')) return;
        
        try {
            await remove(child(contactRef, key));
            utils.showToast('تم حذف قناة التواصل بنجاح');
            // لا حاجة لـ renderContactsGrid() هنا لأن البيانات ستتحدث تلقائياً عبر onValue
        } catch (error) {
            console.error('خطأ في الحذف:', error);
            utils.showToast('حدث خطأ أثناء الحذف: ' + error.message, 'error');
        }
    }

    // البحث - يعمل عند الضغط على زر البحث فقط
    function performSearch() {
        searchQuery = searchInput.value.trim();
        renderContactsGrid();
    }

    // إعداد مستمعي الأحداث
    function setupEventListeners() {
        // البحث عند الضغط على زر البحث فقط
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', performSearch);
        }

        // إضافة قناة جديدة
        addContactBtn.addEventListener('click', () => {
            openContactModal();
        });

        // البحث عند الضغط على Enter (اختياري)
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });
        }
    }

    // التهيئة الرئيسية
    function initialize() {
        setupEventListeners();
        
        // تحميل البيانات والاستماع للتحديثات في الوقت الحقيقي
        onValue(contactRef, (snapshot) => {
            contactsData = snapshot.val() || {};
            renderContactsGrid();
        });

        // التهيئة الأولية للعرض
        renderContactsGrid();
    }

    // بدء التهيئة
    initialize();
}

// ==================== قسم الخدمات ====================
function initServicesSection() {
    const { servicesRef } = getFirebaseRefs();
    const servicesGrid = document.getElementById('servicesGrid');
    const searchInput = document.getElementById('servicesSearch');
    const searchBtn = document.getElementById('servicesSearchBtn');
    const modalRoot = document.getElementById('servicesModalRoot');
    const addServiceBtn = document.getElementById('addServiceBtn');
    
    if (!servicesGrid || !addServiceBtn) return;
    
    let currentServiceKey = null;
    let servicesData = {};
    let searchQuery = '';

    // عرض الخدمات في الشبكة
    function renderServicesGrid() {
        try {
            servicesGrid.innerHTML = '';
            
            if (Object.keys(servicesData).length === 0) {
                emptyStateManager.showEmptyState('serv');
                return;
            }
            
            // إذا كان البحث فارغاً، عرض جميع العناصر
            let filteredServices = Object.entries(servicesData);
            
            if (searchQuery) {
                filteredServices = utils.searchData(
                    servicesData, 
                    searchQuery, 
                    ['title.ar', 'title.en', 'description.ar', 'description.en']
                );
            }
            
            if (filteredServices.length === 0) {
                emptyStateManager.showSearchEmptyState('serv');
                return;
            } else {
                emptyStateManager.hideEmptyState('serv');
            }
            
            // ترتيب العناصر حسب الترتيب
            filteredServices.sort(([, a], [, b]) => (a.order || 0) - (b.order || 0));
            
            // عرض العناصر
            filteredServices.forEach(([key, service]) => {
                const card = createServiceCard(key, service);
                servicesGrid.appendChild(card);
            });
            
        } catch (error) {
            console.error('خطأ في عرض الخدمات:', error);
            utils.showToast('حدث خطأ أثناء تحميل البيانات', 'error');
        }
    }

    // إنشاء بطاقة الخدمة
    function createServiceCard(key, service) {
        const card = document.createElement('div');
        card.className = 'grid-card';
        card.dataset.id = key;
        
        card.innerHTML = `
            <div class="grid-meta">
                <div style="min-width:0">
                    <h3>${service.title?.ar || 'بدون عنوان'}</h3>
                    <small class="muted">${service.title?.en || 'No title'}</small>
                </div>
            </div>
            <div class="grid-meta">
                <div>
                    <span class="order-badge"><i class="fas fa-sort"></i>الترتيب = ${service.order || 0}</span>
                </div>
                <div class="icon-badge" style="background: ${service.color || '#1e90ff'};">
                    <i class="${service.icon || 'fas fa-cog'}"></i>
                </div>
            </div>
            <div class="grid-actions">
                <button class="grid-btn edit"><i class="fas fa-edit"></i> تعديل</button>
                <button class="grid-btn danger del"><i class="fas fa-trash"></i> حذف </button>
            </div>
        `;
        
        // إضافة مستمعي الأحداث
        card.querySelector('.edit').addEventListener('click', (e) => {
            e.stopPropagation();
            editService(key);
        });
        
        card.querySelector('.del').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteService(key);
        });
        
        return card;
    }

    // فتح نافذة إضافة/تعديل الخدمة
    function openServiceModal(key = null, service = null) {
        const isNew = key === null;
        if (!modalRoot) return;
        
        modalRoot.style.display = 'block';
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        modal.innerHTML = `
            <div class="modal-content-new" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
                ${utils.createModalHeader(isNew ? 'إضافة خدمة' : 'تعديل خدمة', 'fas fa-cogs')}
                
                <form id="editServiceForm">
                    <div class="form-compact-new">
                        <div>
                            <label>العنوان (عربي) *</label>
                            <input name="title_ar" value="${isNew ? '' : utils.escapeHtml(service.title?.ar || '')}" required>
                        </div>
                        <div>
                            <label>العنوان (إنجليزي) *</label>
                            <input name="title_en" value="${isNew ? '' : utils.escapeHtml(service.title?.en || '')}" required>
                        </div>

                        <div class="full">
                            <label>الوصف (عربي)</label>
                            <textarea name="desc_ar">${isNew ? '' : utils.escapeHtml(service.description?.ar || '')}</textarea>
                        </div>
                        <div class="full">
                            <label>الوصف (إنجليزي)</label>
                            <textarea name="desc_en">${isNew ? '' : utils.escapeHtml(service.description?.en || '')}</textarea>
                        </div>

                        <div class="full">
                            <label>الأيقونة</label>
                            <div id="iconGridContainer"></div>
                        </div>

                        <div>
                            <label>لون العرض</label>
                            <input type="color" name="color" value="${isNew ? '#1e90ff' : service.color || '#1e90ff'}">
                        </div>

                        <div>
                            <label>ترتيب العرض</label>
                            <input type="number" name="order" value="${isNew ? '1' : service.order || 1}" min="0">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="grid-btn save">
                            <i class="fas fa-save"></i> ${isNew ? 'إضافة' : 'حفظ'}
                        </button>
                        <button type="button" class="grid-btn close">إلغاء</button>
                    </div>
                </form>
            </div>
        `;

        // إضافة شبكة الأيقونات
        const iconGridContainer = modal.querySelector('#iconGridContainer');
        const initialIcon = isNew ? 'fas fa-cogs' : (service.icon || 'fas fa-cogs');
        const { container: iconGrid, getSelectedIcon } = createIconGrid(initialIcon);
        iconGridContainer.appendChild(iconGrid);

        // إضافة المستمعين للأحداث
        modal.querySelector('.modal-close-unified').addEventListener('click', () => {
        modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                modalRoot.style.display = 'none';
            }, 300);
        });

        // حفظ التعديلات
        modal.querySelector('.save').addEventListener('click', async () => {
            await handleServiceSave(modal, key, isNew, getSelectedIcon);
        });

        modalRoot.innerHTML = '';
        modalRoot.appendChild(modal);
        utils.setupModalClose(modal, modalRoot);
    }

    // معالجة حفظ الخدمة
    async function handleServiceSave(modal, key, isNew, getSelectedIcon) {
        const form = modal.querySelector('#editServiceForm');
        const fd = new FormData(form);

        // التحقق من الحقول المطلوبة
        if (!fd.get('title_ar') || !fd.get('title_en')) {
            utils.showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        const serviceData = {
            title: {
                ar: fd.get('title_ar') || '',
                en: fd.get('title_en') || ''
            },
            description: {
                ar: fd.get('desc_ar') || '',
                en: fd.get('desc_en') || ''
            },
            icon: getSelectedIcon(),
            color: fd.get('color') || '#1e90ff',
            order: parseInt(fd.get('order')) || 1
        };
        
        try {
            if (isNew) {
                await push(servicesRef, serviceData);
                utils.showToast('تم إضافة الخدمة بنجاح');
            } else {
                await update(child(servicesRef, key), serviceData);
                utils.showToast('تم حفظ التعديلات بنجاح');
            }
            
            closeModal(modal);
            // لا حاجة لـ renderServicesGrid() هنا لأن البيانات ستتحدث تلقائياً عبر onValue
        } catch (error) {
            console.error('خطأ في الحفظ:', error);
            utils.showToast('حدث خطأ أثناء الحفظ: ' + error.message, 'error');
        }
    }

    // إغلاق المودال
    function closeModal(modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.remove();
            modalRoot.style.display = 'none';
        }, 300);
    }

    // تعديل خدمة
    async function editService(key) {
        try {
            const snap = await get(child(servicesRef, key));
            const service = snap.val();
            openServiceModal(key, service);
        } catch (error) {
            console.error('خطأ في تحرير الخدمة:', error);
            utils.showToast('حدث خطأ أثناء تحميل بيانات الخدمة', 'error');
        }
    }

    // حذف خدمة
    async function deleteService(key) {
        if (!confirm('هل أنت متأكد من حذف هذه الخدمة؟')) return;
        
        try {
            await remove(child(servicesRef, key));
            utils.showToast('تم حذف الخدمة بنجاح');
            // لا حاجة لـ renderServicesGrid() هنا لأن البيانات ستتحدث تلقائياً عبر onValue
        } catch (error) {
            console.error('خطأ في الحذف:', error);
            utils.showToast('حدث خطأ أثناء الحذف: ' + error.message, 'error');
        }
    }

    // البحث - يعمل عند الضغط على زر البحث فقط
    function performSearch() {
        searchQuery = searchInput.value.trim();
        renderServicesGrid();
    }

    // إعداد مستمعي الأحداث
    function setupEventListeners() {
        // البحث عند الضغط على زر البحث فقط
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', performSearch);
        }

        // إضافة خدمة جديدة
        addServiceBtn.addEventListener('click', () => {
            openServiceModal();
        });

        // البحث عند الضغط على Enter (اختياري)
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });
        }
    }

    // التهيئة الرئيسية
    function initialize() {
        setupEventListeners();
        
        // تحميل البيانات والاستماع للتحديثات في الوقت الحقيقي
        onValue(servicesRef, (snapshot) => {
            servicesData = snapshot.val() || {};
            renderServicesGrid();
        });

        // التهيئة الأولية للعرض
        renderServicesGrid();
    }

    // بدء التهيئة
    initialize();
}
// ==================== قسم الإحصائيات ====================
function initStatsSection() {
    const { statsRef } = getFirebaseRefs();
    const statsGrid = document.getElementById('statsGrid');
    const searchInput = document.getElementById('statsSearch');
    const searchBtn = document.getElementById('statsSearchBtn');
    const modalRoot = document.getElementById('statsModalRoot');
    const addStatBtn = document.getElementById('addStatBtn');
    
    if (!statsGrid || !addStatBtn) return;
    
    let statsData = {};
    let searchQuery = '';

    // عرض الإحصائيات في الشبكة
    function renderStatsGrid() {
        statsGrid.innerHTML = '';
        
        if (Object.keys(statsData).length === 0) {
            emptyStateManager.showEmptyState('stats');
            return;
        }
        
        let filteredStats = Object.entries(statsData);
        
        if (searchQuery) {
            filteredStats = utils.searchData(
                statsData,
                searchQuery,
                ['label.ar', 'label.en', 'value', 'unit']
            );
        }
        
        if (filteredStats.length === 0) {
            emptyStateManager.showSearchEmptyState('stats');
            return;
        } else {
            emptyStateManager.hideEmptyState('stats');
        }
        
        filteredStats.sort(([, a], [, b]) => (a.order || 0) - (b.order || 0));
        
        filteredStats.forEach(([key, stat]) => {
            const card = document.createElement('div');
            card.className = 'grid-card';
            card.dataset.id = key;
            
            card.innerHTML = `
                <div class="grid-meta">
                    <div style="min-width:0">
                        <h3>${stat.label?.ar || 'بدون تسمية'}</h3>
                        <small class="muted">${stat.label?.en || 'No label'}</small>
                    </div>
                </div>
                <div class="grid-meta">
                    <div>
                        <span class="stat-value"><i class="fas fa-chart-bar"></i>القيمه = ${stat.value || 0} ${stat.unit || ''}</span>
                    </div>
                </div>
                <div class="grid-meta">
                    <div>
                        <span class="order-badge"><i class="fas fa-sort"></i>الترتيب = ${stat.order || 0}</span>
                    </div>
                    <div class="icon-badge" style="background: ${stat.color || '#3498db'};">
                        <i class="${stat.icon || 'fas fa-chart-line'}"></i>
                    </div>
                </div>
                <div class="grid-actions">
                    <button class="grid-btn edit"><i class="fas fa-edit"></i> تعديل</button>
                    <button class="grid-btn danger del"><i class="fas fa-trash"></i> حذف </button>
                </div>
            `;
            
            card.querySelector('.edit').addEventListener('click', () => editStat(key));
            card.querySelector('.del').addEventListener('click', () => deleteStat(key));
            
            statsGrid.appendChild(card);
        });
    }

    // فتح نافذة إضافة/تعديل الإحصائية
    function openStatModal(key = null, stat = null) {
        const isNew = key === null;
        modalRoot.style.display = 'block';
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        modal.innerHTML = `
            <div class="modal-content-new" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
                ${utils.createModalHeader(isNew ? 'إضافة إحصائية' : 'تعديل إحصائية', 'fas fa-chart-line')}
                
                <form id="editStatForm">
                    <div class="form-compact-new">
                        <div>
                            <label>التسمية (عربي) *</label>
                            <input name="label_ar" value="${isNew ? '' : stat.label?.ar || ''}" required>
                        </div>
                        <div>
                            <label>التسمية (إنجليزي) *</label>
                            <input name="label_en" value="${isNew ? '' : stat.label?.en || ''}" required>
                        </div>

                        <div>
                            <label>القيمة *</label>
                            <input type="number" name="value" value="${isNew ? '0' : stat.value || 0}" min="0" required>
                        </div>

                        <div>
                            <label>الوحدة</label>
                            <input name="unit" value="${isNew ? '' : stat.unit || ''}" placeholder="+ / %">
                        </div>

                        <div class="full">
                            <label>الأيقونة</label>
                            <div id="iconGridContainer"></div>
                        </div>

                        <div>
                            <label>لون العرض</label>
                            <input type="color" name="color" value="${isNew ? '#3498db' : stat.color || '#3498db'}">
                        </div>

                        <div>
                            <label>ترتيب العرض</label>
                            <input type="number" name="order" value="${isNew ? '1' : stat.order || 1}" min="0">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="grid-btn save">
                            <i class="fas fa-save"></i> ${isNew ? 'إضافة' : 'حفظ'}
                        </button>
                        <button type="button" class="grid-btn close">إلغاء</button>
                    </div>
                </form>
            </div>
        `;

        // إضافة شبكة الأيقونات
        const iconGridContainer = modal.querySelector('#iconGridContainer');
        const initialIcon = isNew ? 'fas fa-chart-line' : (stat.icon || 'fas fa-chart-line');
        const { container: iconGrid, getSelectedIcon } = createIconGrid(initialIcon);
        iconGridContainer.appendChild(iconGrid);

        // إضافة المستمعين للأحداث
        modal.querySelector('.modal-close-unified').addEventListener('click', () => {
        modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                modalRoot.style.display = 'none';
            }, 300);
        });

        // حفظ التعديلات
        modal.querySelector('.save').addEventListener('click', async () => {
            const form = modal.querySelector('#editStatForm');
            const fd = new FormData(form);

            if (!fd.get('label_ar') || !fd.get('label_en') || !fd.get('value')) {
                utils.showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
                return;
            }

            const statData = {
                label: {
                    ar: fd.get('label_ar') || '',
                    en: fd.get('label_en') || ''
                },
                value: parseInt(fd.get('value')) || 0,
                unit: fd.get('unit') || '',
                icon: getSelectedIcon(),
                color: fd.get('color') || '#3498db',
                order: parseInt(fd.get('order')) || 1,
                visible: true
            };
            
            try {
                if (isNew) {
                    await push(statsRef, statData);
                    utils.showToast('تم إضافة الإحصائية بنجاح');
                } else {
                    await update(child(statsRef, key), statData);
                    utils.showToast('تم حفظ التعديلات بنجاح');
                }
                
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.remove();
                    modalRoot.style.display = 'none';
                }, 300);
            } catch (error) {
                console.error('خطأ في الحفظ:', error);
                utils.showToast('حدث خطأ أثناء الحفظ: ' + error.message, 'error');
            }
        });

        modalRoot.innerHTML = '';
        modalRoot.appendChild(modal);
        utils.setupModalClose(modal, modalRoot);
    }

    // تعديل إحصائية
    async function editStat(key) {
        try {
            const snap = await get(child(statsRef, key));
            const stat = snap.val();
            openStatModal(key, stat);
        } catch (error) {
            console.error('خطأ في تحرير الإحصائية:', error);
            utils.showToast('حدث خطأ أثناء تحميل بيانات الإحصائية', 'error');
        }
    }

    // حذف إحصائية
    async function deleteStat(key) {
        if (!confirm('هل أنت متأكد من حذف هذه الإحصائية؟')) return;
        
        try {
            await remove(child(statsRef, key));
            utils.showToast('تم حذف الإحصائية بنجاح');
        } catch (error) {
            console.error('خطأ في الحذف:', error);
            utils.showToast('حدث خطأ أثناء الحذف: ' + error.message, 'error');
        }
    }

    // البحث
    function performSearch() {
        searchQuery = searchInput.value.trim();
        renderStatsGrid();
    }

    // إعداد مستمعي الأحداث
    function setupEventListeners() {
        // البحث عند الضغط على زر البحث فقط
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', performSearch);
        }

        // إضافة إحصائية جديدة
        addStatBtn.addEventListener('click', () => {
            openStatModal();
        });
    }

    // التهيئة الرئيسية
    function initialize() {
        setupEventListeners();
        
        // تحميل البيانات والاستماع للتحديثات في الوقت الحقيقي
        onValue(statsRef, (snapshot) => {
            statsData = snapshot.val() || {};
            renderStatsGrid();
        });
    }

    // بدء التهيئة
    initialize();
}
// ==================== قسم العروض ====================
function initPromoSection() {
    const { promosRef, categoriesRef, productsRef } = getFirebaseRefs();
    const promosGrid = document.getElementById('promosGrid'); 
    const searchInput = document.getElementById('promosSearch');
    const typeFilter = document.getElementById('promoTypeFilter');
    const statusFilter = document.getElementById('promoStatusFilter');
    const searchBtn = document.getElementById('promosSearchBtn');
    const modalRoot = document.getElementById('promosModalRoot');
    const addCategoryPromoBtn = document.getElementById('addCategoryPromoBtn');
    const addProductPromoBtn = document.getElementById('addProductPromoBtn');

    let currentPromoKey = null;
    let promosData = {};
    let categoriesData = {};
    let productsData = {};
    let searchQuery = '';
    let selectedType = 'all';
    let selectedStatus = 'all';

    // عرض العروض في الشبكة
    function renderPromosGrid() {
        try {
            promosGrid.innerHTML = '';
            
            if (Object.keys(promosData).length === 0) {
                emptyStateManager.showEmptyState('time');
                return;
            }
            
            const now = Date.now();
            const filteredPromos = Object.entries(promosData).filter(([key, promo]) => {
                // تطبيق فلتر النوع
                if (selectedType !== 'all' && promo.type !== selectedType) {
                    return false;
                }
                
                // تطبيق فلتر الحالة
                if (selectedStatus !== 'all') {
                    const isActive = promo.active !== false && new Date(promo.endDate).getTime() > now;
                    
                    if (selectedStatus === 'active' && !isActive) {
                        return false;
                    }
                    
                    if (selectedStatus === 'expired' && isActive) {
                        return false;
                    }
                }
                
                // تطبيق بحث النص
                if (searchQuery) {
                    const searchText = searchQuery.toLowerCase();
                    
                    if (promo.type === 'category') {
                        const category = categoriesData[promo.categoryKey];
                        const categoryName = category && category.name ? category.name.ar : 'قسم غير معروف';
                        if (!categoryName.toLowerCase().includes(searchText)) {
                            return false;
                        }
                    } else {
                        const product = productsData[promo.productKey];
                        const productName = product && product.title ? product.title.ar : 'منتج غير معروف';
                        if (!productName.toLowerCase().includes(searchText)) {
                            return false;
                        }
                    }
                }
                
                // إذا كان العرض لمنتج وكمية المنتج 0، نخفيه
                if (promo.type === 'product') {
                    const product = productsData[promo.productKey];
                    if (!product || product.quantity <= 0) {
                        return false;
                    }
                }
                return true;
            });
            
            if (filteredPromos.length === 0) {
                emptyStateManager.showSearchEmptyState('time');
                return;
            } else {
                emptyStateManager.hideEmptyState('time');
            }
            
            // ترتيب العروض حسب تاريخ الإنشاء (الأحدث أولاً)
            filteredPromos.sort(([, a], [, b]) => {
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            });
            
            filteredPromos.forEach(([key, promo]) => {
                const now = Date.now();
                const endDate = new Date(promo.endDate).getTime();
                const isActive = promo.active !== false && endDate > now;
                const statusClass = isActive ? 'status-active' : 'status-expired';
                const statusText = isActive ? 'نشط' : 'منتهي';
                
                let promoTitle = '';
                let targetName = '';
                
                if (promo.type === 'category') {
                    const category = categoriesData[promo.categoryKey];
                    const categoryName = category && category.name ? category.name.ar : 'قسم غير معروف';
                    promoTitle = `عرض على قسم: ${categoryName}`;
                    targetName = categoryName;
                } else {
                    const product = productsData[promo.productKey];
                    const productName = product && product.title ? product.title.ar : 'منتج غير معروف';
                    promoTitle = `عرض على منتج: ${productName}`;
                    targetName = productName;
                }
    
                let promoImage = '';
                let hasImage = false;
    
                if (promo.image) {
                    promoImage = promo.image;
                    hasImage = true;
                } else if (promo.type === 'category') {
                    const category = categoriesData[promo.categoryKey];
                    if (category && category.image) {
                        promoImage = category.image;
                        hasImage = true;
                    }
                } else {
                    const product = productsData[promo.productKey];
                    if (product && product.images && product.images.length > 0) {
                        promoImage = product.images[0].url;
                        hasImage = true;
                    }
                }
      
                const card = document.createElement('div');
                card.className = 'grid-card';
                card.dataset.id = key;
                
                card.innerHTML = `
                    <div class="grid-thumb ${!hasImage ? 'no-image' : ''}">
                        ${hasImage ? 
                            `<img src="${promoImage}" alt="${promoTitle}" onerror="this.parentElement.className='grid-thumb no-image'">` : 
                            `<div class="no-image"><i class="fas fa-tag"></i></div>`
                        }
                        <div class="promo-badge">${promo.discountPercentage}% خصم</div>
                    </div>
                    <div class="grid-meta">
                        <div style="min-width:0">
                            <h3>${promoTitle}</h3>
                            <small class="muted">${targetName}</small>
                        </div>
                    </div>
                    <div class="grid-meta">
                        <div>
                            <span class="price-tag"><i class="fas fa-clock"></i>ينتهي في = ${new Date(promo.endDate).toLocaleDateString('ar-EG')}</span>
                        </div>
                    </div>
                    <div class="grid-meta">
                        <div>
                            <span class="status-pill ${statusClass}">
                                <i class="fas ${isActive ? 'fa-bolt' : 'fa-clock'}"></i> ${statusText}
                            </span>
                        </div>
                    </div>
                    <div class="grid-meta">
                        <div>
                            <span class="category-badge-promo">
                                <i class="fas ${promo.type === 'category' ? 'fa-list' : 'fa-box'}"></i> 
                                ${promo.type === 'category' ? 'عرض قسم' : 'عرض منتج'}
                            </span>
                        </div>
                    </div>
                    <div class="grid-actions">
                        <button class="grid-btn edit"><i class="fas fa-edit"></i> تعديل</button>
                        <button class="grid-btn danger del"><i class="fas fa-trash"></i> حذف </button>
                    </div>
                `;
                
                card.querySelector('.edit').addEventListener('click', () => editPromo(key));
                card.querySelector('.del').addEventListener('click', () => deletePromo(key));
                
                promosGrid.appendChild(card);
            });
            
        } catch (error) {
            console.error('خطأ في عرض العروض:', error);
            utils.showToast('حدث خطأ أثناء تحميل البيانات', 'error');
        }
    }

    // فتح نافذة إضافة عرض على قسم
    function openCategoryPromoModal(key = null, promo = null) {
        const isNew = key === null;
        modalRoot.style.display = 'block';
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        modal.innerHTML = `
            <div class="modal-content-new" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
                ${utils.createModalHeader(isNew ? 'إضافة عرض' : 'تعديل عرض', 'fas fa-tags')}
                <form id="editCategoryPromoForm">
                    <div class="form-compact-new">
                        <div>
                            <label>القسم</label>
                            <select name="category" required>
                                <option value="">اختر قسم...</option>
                                ${Object.entries(categoriesData).map(([catKey, category]) => 
                                    `<option value="${catKey}" ${!isNew && catKey === promo.categoryKey ? 'selected' : ''}>
                                        ${category.name?.ar || 'غير معروف'}
                                    </option>`
                                ).join('')}
                            </select>
                        </div>

                        <div>
                            <label>نسبة الخصم (%)</label>
                            <input type="number" name="discount" value="${isNew ? '' : promo.discountPercentage || 0}" min="1" max="100" required>
                        </div>

                        <div>
                            <label>تاريخ الانتهاء</label>
                            <input type="date" name="endDate" value="${isNew ? '' : promo.endDate || ''}" required>
                        </div>

                        <div class="full">
                            <label>صورة العرض (اختياري)</label>
                            <div class="image-upload-container" id="imageUploadContainer">
                                <img id="imagePreview" class="image-preview" src="${isNew ? '' : promo.image || ''}" ${isNew || !promo.image ? 'style="display:none"' : ''}>
                                <input type="file" id="imageUpload" accept="image/*" style="display: none;">
                                <button type="button" class="upload-btn" onclick="document.getElementById('imageUpload').click()">
                                    <i class="fas fa-upload"></i> ${isNew ? 'اختر صورة' : 'تغيير الصورة'}
                                </button>
                                <input type="hidden" id="promoImage" value="${isNew ? '' : promo.image || ''}">
                            </div>
                        </div>

                        <div>
                            <label>نشط</label>
                            <input type="checkbox" name="active" ${isNew || promo.active !== false ? 'checked' : ''}>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="grid-btn save">
                            <i class="fas fa-save"></i> ${isNew ? 'إضافة' : 'حفظ'}
                        </button>
                        <button type="button" class="grid-btn close">إلغاء</button>
                    </div>
                </form>
            </div>
        `;

        // إعداد رفع الصورة
        const imageUpload = modal.querySelector('#imageUpload');
        const imagePreview = modal.querySelector('#imagePreview');
        const promoImage = modal.querySelector('#promoImage');
        const uploadBtn = modal.querySelector('.upload-btn');
        
        imageUpload.addEventListener('change', async function() {
            if (imageUpload.files.length) {
                await handleImageUpload(imageUpload.files[0], imagePreview, promoImage, uploadBtn);
            }
        });

        // إضافة المستمعين للأحداث
        modal.querySelector('.modal-close-unified').addEventListener('click', () => {
        modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                modalRoot.style.display = 'none';
            }, 300);
        });
        // حفظ التعديلات
        modal.querySelector('.save').addEventListener('click', async () => {
            const form = modal.querySelector('#editCategoryPromoForm');
            const fd = new FormData(form);

            // التحقق من الحقول المطلوبة
            if (!fd.get('category') || !fd.get('discount') || !fd.get('endDate')) {
                utils.showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
                return;
            }

            const endDate = fd.get('endDate');
            if (!endDate) {
                utils.showToast('يرجى اختيار تاريخ انتهاء العرض', 'error');
                return;
            }
            
            const promoData = {
                type: 'category',
                categoryKey: fd.get('category'),
                discountPercentage: parseInt(fd.get('discount')) || 0,
                endDate: endDate,
                active: fd.get('active') === 'on',
                image: promoImage.value || '',
                createdAt: isNew ? new Date().toISOString() : (promo.createdAt || new Date().toISOString()),
                updatedAt: new Date().toISOString()
            };
            
            try {
                if (isNew) {
                    await push(promosRef, promoData);
                    utils.showToast('تم إضافة العرض بنجاح');
                } else {
                    await update(child(promosRef, key), promoData);
                    utils.showToast('تم حفظ التعديلات بنجاح');
                }
                
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.remove();
                    modalRoot.style.display = 'none';
                    renderPromosGrid();
                }, 300);
            } catch (error) {
                console.error('خطأ في الحفظ:', error);
                utils.showToast('حدث خطأ أثناء الحفظ: ' + error.message, 'error');
            }
        });

        modalRoot.innerHTML = '';
        modalRoot.appendChild(modal);
        utils.setupModalClose(modal, modalRoot);
    }

    // فتح نافذة إضافة عرض على منتج
    function openProductPromoModal(key = null, promo = null) {
        const isNew = key === null;
        modalRoot.style.display = 'block';
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        modal.innerHTML = `
            <div class="modal-content-new" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
                ${utils.createModalHeader(isNew ? 'إضافة عرض' : 'تعديل عرض', 'fas fa-tags')}
                <form id="editProductPromoForm">
                    <div class="form-compact-new">
                        <div>
                            <label>المنتج</label>
                            <select name="product" required>
                                <option value="">اختر منتج...</option>
                                ${Object.entries(productsData)
                                    .filter(([prodKey, product]) => (product.quantity || 0) > 0)
                                    .map(([prodKey, product]) => 
                                `<option value="${prodKey}" ${!isNew && prodKey === promo.productKey ? 'selected' : ''}>
                                ${product.title?.ar || 'غير معروف'}
                                </option>`
                                ).join('')}
                            </select>
                        </div>

                        <div>
                            <label>نسبة الخصم (%)</label>
                            <input type="number" name="discount" value="${isNew ? '' : promo.discountPercentage || 0}" min="1" max="100" required>
                        </div>

                        <div>
                            <label>تاريخ الانتهاء</label>
                            <input type="date" name="endDate" value="${isNew ? '' : promo.endDate || ''}" required>
                        </div>

                        <div>
                            <label>نشط</label>
                            <input type="checkbox" name="active" ${isNew || promo.active !== false ? 'checked' : ''}>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="grid-btn save">
                            <i class="fas fa-save"></i> ${isNew ? 'إضافة' : 'حفظ'}
                        </button>
                        <button type="button" class="grid-btn close">إلغاء</button>
                    </div>
                </form>
            </div>
        `;

        // إضافة المستمعين للأحداث
        modal.querySelector('.modal-close-unified').addEventListener('click', () => {
        modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                modalRoot.style.display = 'none';
            }, 300);
        });

        // حفظ التعديلات
        modal.querySelector('.save').addEventListener('click', async () => {
            const form = modal.querySelector('#editProductPromoForm');
            const fd = new FormData(form);

            // التحقق من الحقول المطلوبة
            if (!fd.get('product') || !fd.get('discount') || !fd.get('endDate')) {
                utils.showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
                return;
            }

            // التحقق من أن المنتج المختار كميته > 0
            const productKey = fd.get('product');
            const selectedProduct = productsData[productKey];
            if (!selectedProduct || selectedProduct.quantity <= 0) {
                utils.showToast('لا يمكن إنشاء عرض لمنتج غير متوفر (الكمية 0)', 'error');
                return;
            }

            const endDate = fd.get('endDate');
            if (!endDate) {
                utils.showToast('يرجى اختيار تاريخ انتهاء العرض', 'error');
                return;
            }
            
            const promoData = {
                type: 'product',
                productKey: fd.get('product'),
                discountPercentage: parseInt(fd.get('discount')) || 0,
                endDate: endDate,
                active: fd.get('active') === 'on',
                createdAt: isNew ? new Date().toISOString() : (promo.createdAt || new Date().toISOString()),
                updatedAt: new Date().toISOString()
            };
            
            try {
                if (isNew) {
                    await push(promosRef, promoData);
                    utils.showToast('تم إضافة العرض بنجاح');
                } else {
                    await update(child(promosRef, key), promoData);
                    utils.showToast('تم حفظ التعديلات بنجاح');
                }
                
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.remove();
                    modalRoot.style.display = 'none';
                    renderPromosGrid();
                }, 300);
            } catch (error) {
                console.error('خطأ في الحفظ:', error);
                utils.showToast('حدث خطأ أثناء الحفظ: ' + error.message, 'error');
            }
        });

        modalRoot.innerHTML = '';
        modalRoot.appendChild(modal);
        utils.setupModalClose(modal, modalRoot);
    }

    // معالجة رفع الصورة
    async function handleImageUpload(file, imagePreview, promoImage, uploadBtn) {
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الرفع...';
        uploadBtn.classList.add('uploading');
        
        try {
            const result = await cloudinaryManager.uploadImage(file);
            
            // حفظ رابط الصورة
            promoImage.value = result.url;
            
            // عرض معاينة الصورة
            imagePreview.src = result.url;
            imagePreview.style.display = 'block';
            
            // إعادة ضبط زر الرفع
            uploadBtn.innerHTML = '<i class="fas fa-upload"></i> تم الرفع';
            setTimeout(() => {
                uploadBtn.innerHTML = '<i class="fas fa-upload"></i> تغيير الصورة';
                uploadBtn.classList.remove('uploading');
            }, 2000);
        } catch (error) {
            console.error('Error uploading image:', error);
            utils.showToast('حدث خطأ أثناء رفع الصورة', 'error');
            uploadBtn.innerHTML = '<i class="fas fa-upload"></i> اختر صورة';
            uploadBtn.classList.remove('uploading');
        }
    }

    // تعديل عرض
    async function editPromo(key) {
        try {
            const snap = await get(child(promosRef, key));
            const promo = snap.val();
            
            if (promo.type === 'category') {
                openCategoryPromoModal(key, promo);
            } else {
                openProductPromoModal(key, promo);
            }
        } catch (error) {
            console.error('خطأ في تحرير العرض:', error);
            utils.showToast('حدث خطأ أثناء تحميل بيانات العرض', 'error');
        }
    }

    // حذف عرض
    async function deletePromo(key) {
        if (!confirm('هل أنت متأكد من حذف هذا العرض؟')) return;
        
        try {
            await remove(child(promosRef, key));
            renderPromosGrid();
            utils.showToast('تم حذف العرض بنجاح');
        } catch (error) {
            console.error('خطأ في الحذف:', error);
            utils.showToast('حدث خطأ أثناء الحذف: ' + error.message, 'error');
        }
    }

    // تحميل الأقسام والمنتجات
    async function loadCategoriesAndProducts() {
        try {
            const [categoriesSnap, productsSnap] = await Promise.all([
                get(categoriesRef),
                get(productsRef)
            ]);
            
            categoriesData = categoriesSnap.val() || {};
            productsData = productsSnap.val() || {};
            
            // إعادة عرض العروض عند توفر البيانات
            if (Object.keys(promosData).length > 0) {
                renderPromosGrid();
            }
        } catch (error) {
            console.error('خطأ في تحميل الأقسام أو المنتجات:', error);
            utils.showToast('حدث خطأ أثناء تحميل البيانات', 'error');
        }
    }

    // البحث والتصفية
    const performSearch = () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    selectedType = typeFilter.value;
    selectedStatus = statusFilter.value;
    renderPromosGrid();
    };

    if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', performSearch);
    }

    if (typeFilter) {
        typeFilter.addEventListener('change', () => {
            selectedType = typeFilter.value;
            renderPromosGrid();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            selectedStatus = statusFilter.value;
            renderPromosGrid();
        });
    }

    // إضافة عرض جديد على قسم
    addCategoryPromoBtn.addEventListener('click', () => {
        openCategoryPromoModal();
    });

    // إضافة عرض جديد على منتج
    addProductPromoBtn.addEventListener('click', () => {
        openProductPromoModal();
    });

    // التهيئة الأولية
    function initialize() {
        // تحميل بيانات العروض
        onValue(promosRef, (snapshot) => {
            promosData = snapshot.val() || {};
            renderPromosGrid();
        });

        // تحميل بيانات المنتجات
        onValue(productsRef, (snapshot) => {
            productsData = snapshot.val() || {};
            renderPromosGrid();
        });

        // تحميل الأقسام والمنتجات
        loadCategoriesAndProducts();
    }

    initialize();
}

// ==================== قسم من نحن ====================
function initAboutSection() {
    const { aboutRef } = getFirebaseRefs();
    const aboutAr = document.getElementById('aboutAr');
    const aboutEn = document.getElementById('aboutEn');
    const aboutForm = document.getElementById('aboutForm');

    if (!aboutAr || !aboutEn || !aboutForm) return;

    let aboutKey = null;

    onValue(aboutRef, snapshot => {
        const data = snapshot.val() || {};
        const key = Object.keys(data)[0];
        if (key) {
            aboutKey = key;
            const content = data[key].content || {};
            aboutAr.value = content.ar || '';
            aboutEn.value = content.en || '';
        }
    });

    aboutForm.addEventListener('submit', e => {
        e.preventDefault();
        const payload = {
            content: {
                ar: aboutAr.value.trim(),
                en: aboutEn.value.trim()
            }
        };

        const savePromise = aboutKey 
            ? update(ref(db, `storeAboutUs/${aboutKey}`), payload)
            : push(aboutRef, payload);

        savePromise
            .then(() => utils.showToast('تم حفظ المحتوى بنجاح'))
            .catch(err => utils.showToast('خطأ أثناء الحفظ: ' + err.message, 'error'));
    });
}

// ==================== قسم المنتجات ====================
function initProductsSection() {
    const { categoriesRef, productsRef } = getFirebaseRefs();
    const productsGrid = document.getElementById('productsGrid');
    const searchInput = document.getElementById('productsSearch');
    const searchBtn = document.getElementById('productsSearchBtn');
    const modalRoot = document.getElementById('productsModalRoot');
    const addProductBtn = document.getElementById('addProductBtn');
    const importJsonBtn = document.getElementById('importJsonBtn');
    const jsonFileInput = document.getElementById('jsonFileInput');

    let currentProductKey = null;
    let currentImages = [];
    let imagesToDelete = [];
    let categoriesData = {};
    let selectedFilter = 'all';
    let searchQuery = '';
    let productsData = {};
    let selectedQuantityFilter = 'all';

    // ======== استيراد JSON للمنتجات ========
    function setupJSONImport() {
        if (!importJsonBtn || !jsonFileInput) return;

        importJsonBtn.addEventListener('click', () => {
            jsonFileInput.click();
        });

        jsonFileInput.addEventListener('change', handleJSONFileUpload);
    }

    async function handleJSONFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        event.target.value = '';

        try {
            const products = await readJSONFile(file);
            await importProductsFromJSON(products);
        } catch (error) {
            utils.handleJSONImportError(error);
        }
    }

    function readJSONFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const products = JSON.parse(e.target.result);
                    resolve(products);
                } catch (error) {
                    reject(new Error('ملف JSON غير صالح'));
                }
            };

            reader.onerror = () => reject(new Error('فشل في قراءة الملف'));
            reader.readAsText(file);
        });
    }

    
    async function importProductsFromJSON(productsArray) {
    console.log('🔄 بدء استيراد المنتجات من JSON...');
    
    if (!Array.isArray(productsArray)) {
        throw new Error('يجب أن يحتوي ملف JSON على مصفوفة من المنتجات');
    }

    // إنشاء شريط التقدم
    const progressBar = utils.createProgressBar('استيراد المنتجات', 'fas fa-boxes');
    
    let importedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const errors = [];
    const duplicates = [];

    try {
        console.log(`📦 جاري استيراد ${productsArray.length} منتج...`);
        
        for (const [index, productData] of productsArray.entries()) {
            try {
                // تحديث شريط التقدم
                utils.updateProgressBar(progressBar, index, productsArray.length);
                
                console.log(`🔄 معالجة المنتج ${index + 1} من ${productsArray.length}`);
                
                // التحقق من البيانات الأساسية
                if (!productData.title_ar || !productData.title_en) {
                    const errorMsg = `المنتج ${index + 1}: العنوان العربي والإنجليزي مطلوبان`;
                    errors.push(errorMsg);
                    errorCount++;
                    continue;
                }

                if (!productData.category) {
                    errors.push(`المنتج ${index + 1}: القسم مطلوب`);
                    errorCount++;
                    continue;
                }

                // التحقق من عدم تكرار المنتج
                const titleAr = productData.title_ar.toString().trim();
                const titleEn = productData.title_en.toString().trim();
                
                const isDuplicate = Object.values(productsData).some(product => 
                    product.title?.ar?.trim() === titleAr && 
                    product.title?.en?.trim() === titleEn
                );

                if (isDuplicate) {
                    console.log(`⏭️ تخطي منتج مكرر: ${titleAr}`);
                    duplicates.push(titleAr);
                    duplicateCount++;
                    continue;
                }

                // البحث عن القسم أو إنشاء قسم جديد
                let categoryKey = null;
                for (const [key, category] of Object.entries(categoriesData)) {
                    if (category.name?.ar === productData.category || category.name?.en === productData.category) {
                        categoryKey = key;
                        break;
                    }
                }

                if (!categoryKey) {
                    try {
                        const newCategoryRef = await push(categoriesRef, {
                            name: {
                                ar: productData.category,
                                en: productData.category
                            },
                            icon: 'fas fa-tag',
                            order: 1
                        });
                        categoryKey = newCategoryRef.key;

                        categoriesData[categoryKey] = {
                            name: {
                                ar: productData.category,
                                en: productData.category
                            },
                            icon: 'fas fa-tag',
                            order: 1
                        };

                        utils.showToast(`تم إنشاء قسم جديد: ${productData.category}`);
                    } catch (error) {
                        errors.push(`المنتج ${index + 1}: فشل في إنشاء قسم جديد - ${productData.category}`);
                        errorCount++;
                        continue;
                    }
                }

                // إعداد بيانات المنتج
                const product = {
                    title: {
                        ar: titleAr,
                        en: titleEn
                    },
                    description: {
                        ar: productData.desc_ar || '',
                        en: productData.desc_en || ''
                    },
                    tags: {
                        ar: productData.tags_ar ? 
                            (Array.isArray(productData.tags_ar) ? 
                             productData.tags_ar : 
                             productData.tags_ar.split(',').map(t => t.trim()).filter(t => t)) 
                            : [],
                        en: productData.tags_en ? 
                            (Array.isArray(productData.tags_en) ? 
                             productData.tags_en : 
                             productData.tags_en.split(',').map(t => t.trim()).filter(t => t)) 
                            : []
                    },
                    category: categoryKey,
                    price: parseFloat(productData.price) || 0,
                    quantity: parseInt(productData.quantity) || 0,
                    order: parseInt(productData.order) || 1,
                    color: productData.color || '#ffffff',
                    textColor: productData.textColor || '#000000',
                    images: productData.images || [],
                    createdAt: Date.now()
                };

                // إضافة المنتج إلى Firebase - مرة واحدة فقط
                const newProductRef = await push(productsRef, product);
                importedCount++;
                
                // تحديث البيانات المحلية فوراً
                productsData[newProductRef.key] = product;

                console.log(`✅ تم استيراد المنتج ${index + 1} بنجاح: ${titleAr}`);
                
                // تحديث العداد كل 10 منتجات
                if (importedCount % 10 === 0) {
                    utils.showToast(`تم استيراد ${importedCount} من ${productsArray.length} منتج...`, 'info');
                }

            } catch (error) {
                const errorMsg = `المنتج ${index + 1}: ${error.message}`;
                console.error(`❌ ${errorMsg}`);
                errors.push(errorMsg);
                errorCount++;
            }

            // إضافة تأخير بسيط لتجنب تجاوز حد Firebase
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // إكمال شريط التقدم
        utils.completeProgressBar(progressBar);
        
        console.log(`🎯 اكتمل الاستيراد: ${importedCount} نجاح, ${duplicateCount} مكرر, ${errorCount} فشل`);
        
        // عرض النتائج النهائية
        showImportResults(importedCount, duplicateCount, errorCount, errors, duplicates);
        
    } catch (error) {
        console.error('❌ خطأ عام في الاستيراد:', error);
        utils.removeProgressBar(progressBar);
        throw error;
    }
}
    
    // دالة مساعدة لعرض نتائج الاستيراد
    function showImportResults(importedCount, duplicateCount, errorCount, errors, duplicates) {
        let message = `تم استيراد ${importedCount} منتج بنجاح`;
        let type = 'success';
        
        if (duplicateCount > 0) {
            message += `, تم تخطي ${duplicateCount} منتج مكرر`;
        }
        
        if (errorCount > 0) {
            message += `, مع ${errorCount} أخطاء`;
            type = 'error';
        }
        
        utils.showToast(message, type);
        
        // عرض تفاصيل إضافية في console
        if (duplicates.length > 0) {
            console.log('📋 المنتجات المكررة التي تم تخطيها:', duplicates);
        }
        
        if (errors.length > 0) {
            console.warn('❌ أخطاء الاستيراد:', errors);
        }
        
        // إعادة تحميل الشبكة إذا تم استيراد أي منتج
        if (importedCount > 0) {
            renderProductsGrid();
        }
    }

    // تحميل الأقسام
    async function populateCategories() {
        try {
            const snapshot = await get(categoriesRef);
            categoriesData = snapshot.val() || {};
            renderFilters();
            renderProductsGrid();
        } catch (error) {
            console.error('خطأ في تحميل الأقسام:', error);
            utils.showToast('فشل في تحميل قائمة الأقسام', 'error');
        }
    }

    async function uploadImages(files) {
        const uploadedImages = [];
        for (const file of files) {
            try {
                const result = await cloudinaryManager.uploadImage(file);
                uploadedImages.push(result);
            } catch (error) {
                console.error('خطأ في رفع الصورة:', error);
                throw error;
            }
        }
        return uploadedImages;
    }

    async function deleteImages(images) {
        if (!images || images.length === 0) return;
        await cloudinaryManager.deleteMultipleImages(images);
    }

    function renderFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;

    // حفظ القيمة المختارة حالياً
    const currentValue = categoryFilter.value;

    // تفريغ القائمة مع الحفاظ على الخيارين الأساسيين
    const baseOptions = categoryFilter.querySelectorAll('option[value="all"], option[value="outOfStock"]');
    categoryFilter.innerHTML = '';
    baseOptions.forEach(option => categoryFilter.appendChild(option));

    // إضافة الأقسام من البيانات
    Object.entries(categoriesData).forEach(([key, category]) => {
        if (!category.name?.ar) return;

        const option = document.createElement('option');
        option.value = key;
        option.textContent = category.name.ar;
        categoryFilter.appendChild(option);
    });

    // استعادة القيمة المختارة إذا كانت لا تزال موجودة
    if (currentValue && categoryFilter.querySelector(`option[value="${currentValue}"]`)) {
        categoryFilter.value = currentValue;
    }
    }

    function setupFilterEventListeners() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', function() {
                if (this.value === 'outOfStock') {
                    selectedQuantityFilter = 'outOfStock';
                    selectedFilter = 'all';
                } else {
                    selectedQuantityFilter = 'all';
                    selectedFilter = this.value;
                }
                renderProductsGrid();
            });
        }
    }
    
    // عرض المنتجات في الشبكة
    function renderProductsGrid() {
        try {
            productsGrid.innerHTML = '';

            if (Object.keys(productsData).length === 0) {
                emptyStateManager.showEmptyState('products');
                return;
            }

            const filteredProducts = Object.entries(productsData).filter(([key, product]) => {
                if (selectedFilter !== 'all' && product.category !== selectedFilter) {
                    return false;
                }

                if (selectedQuantityFilter === 'outOfStock' && product.quantity !== 0) {
                    return false;
                }

                if (searchQuery) {
                    const searchText = searchQuery.toLowerCase();
                    const productText = (
                        (product.title?.ar || '') + 
                        (product.title?.en || '') + 
                        (product.description?.ar || '') + 
                        (product.description?.en || '')
                    ).toLowerCase();

                    if (!productText.includes(searchText)) {
                        return false;
                    }
                }

                return true;
            });

            if (filteredProducts.length === 0) {
                emptyStateManager.showSearchEmptyState('products');
                return;
            } else {
                emptyStateManager.hideEmptyState('products');
            }

            filteredProducts.sort(([, a], [, b]) => (a.order || 0) - (b.order || 0));

            utils.renderChunked(filteredProducts, productsGrid, ([key, product]) => {
                const categoryName = categoriesData[product.category]?.name?.ar || 'غير مصنف';
                const tags = Array.isArray(product.tags?.ar) ? product.tags.ar :
                            (product.tags?.ar || '').split(',').map(t => t.trim());

                const tagsHtml = tags.map(tag => `<span class="tag">${tag}</span>`).join('');

                const card = document.createElement('div');
                card.className = 'grid-card';
                card.dataset.id = key;
                card.dataset.category = product.category || '';

                const quantity = product.quantity || 0;
                let quantityClass = 'high-quantity';
                if (quantity === 0) {
                    quantityClass = 'low-quantity';
                } else if (quantity < 10) {
                    quantityClass = 'medium-quantity';
                }

                const previewImage = product.images && product.images.length > 0 ? 
                  `<img src="${product.images[0].url}" alt="${product.images[0].alt || 'معاينة المنتج'}">` :
                  `<div class="no-image"><i class="fas fa-image"></i></div>`;

                card.innerHTML = `
                <div class="grid-thumb ${!product.images || product.images.length === 0 ? 'no-image' : ''}">
                    ${product.images && product.images.length > 0 ? 
                        `<img src="${product.images[0].url}" alt="${product.images[0].alt || 'معاينة المنتج'}">` : 
                        `<div class="no-image"><i class="fas fa-image"></i></div>`
                    }
                </div>
                <div class="grid-meta">
                    <div style="min-width:0">
                        <h3>${product.title?.ar || 'بدون عنوان'}</h3>
                        <small class="muted">${product.title?.en || 'No title'}</small>
                    </div>
                </div>
                <div class="grid-meta">
                    <div>
                        <span class="category-badge-product"><i class="fas fa-folder"></i> ${categoryName}</span>
                    </div>
                    <div>
                        <span class="order-badge"><i class="fas fa-sort"></i>الترتيب = ${product.order || 0}</span>
                    </div>
                </div>
                <div class="grid-meta">
                    <div class="tag-container">
                        <small>${tagsHtml}</small>
                    </div>
                </div>
                <div class="grid-meta">
                    <div>
                        <span class="quantity-badge ${quantityClass}"> <i class="fas fa-box"></i>الكميه= ${quantity}</span>
                    </div>
                    <div>
                        <span class="price-tag"><i class="fas fa-tag"></i>السعر = $${product.price ? product.price.toLocaleString() : '0'}</span>
                    </div>
                </div>
                <div class="grid-actions">
                    <button class="grid-btn edit"><i class="fas fa-edit"></i> تعديل</button>
                    <button class="grid-btn danger del"><i class="fas fa-trash"></i> حذف </button>
                </div>
                `;

                card.querySelector('.edit').addEventListener('click', () => editProduct(key));
                card.querySelector('.del').addEventListener('click', () => deleteProduct(key));

                return card;
            });

        } catch (error) {
            console.error('خطأ في عرض المنتجات:', error);
            utils.showToast('حدث خطأ أثناء تحميل البيانات', 'error');
        }
    }

    // تعديل منتج
    async function editProduct(key) {
        try {
            const snap = await get(child(productsRef, key));
            const product = snap.val();
            openProductModal(key, product);
        } catch (error) {
            console.error('خطأ في تحرير المنتج:', error);
            utils.showToast('حدث خطأ أثناء تحميل بيانات المنتج', 'error');
        }
    }

    // فتح نافذة تعديل/إضافة المنتج
    function openProductModal(key = null, product = null) {
        const isNew = key === null;
        if (!modalRoot) return;

        modalRoot.style.display = 'block';

        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';

        modal.innerHTML = `
            <div class="modal-content-new" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
                ${utils.createModalHeader(isNew ? 'إضافة منتج' : 'تعديل منتج', 'fas fa-box')}

                <form id="editProductForm">
                    <div class="form-compact-new">
                        <div>
                            <label>اسم المنتج (عربي)</label>
                            <input name="title_ar" value="${isNew ? '' : utils.escapeHtml(product.title?.ar || '')}" required>
                        </div>
                        <div>
                            <label>اسم المنتج (إنجليزي)</label>
                            <input name="title_en" value="${isNew ? '' : utils.escapeHtml(product.title?.en || '')}" required>
                        </div>

                        <div class="full">
                            <label>الوصف (عربي)</label>
                            <textarea name="desc_ar">${isNew ? '' : utils.escapeHtml(product.description?.ar || '')}</textarea>
                        </div>
                        <div class="full">
                            <label>الوصف (إنجليزي)</label>
                            <textarea name="desc_en">${isNew ? '' : utils.escapeHtml(product.description?.en || '')}</textarea>
                        </div>

                        <div>
                            <label>المميزات (عربي)</label>
                            <input name="tags_ar" value="${isNew ? '' : (Array.isArray(product.tags?.ar) ? product.tags.ar.join(', ') : product.tags?.ar || '')}" placeholder="مفصولة بفواصل">
                        </div>
                        <div>
                            <label>المميزات (إنجليزي)</label>
                            <input name="tags_en" value="${isNew ? '' : (Array.isArray(product.tags?.en) ? product.tags.en.join(', ') : product.tags?.en || '')}" placeholder="مفصولة بفواصل">
                        </div>

                        <div>
                            <label>القسم</label>
                            <select name="category" required>
                                <option value="">اختر قسم...</option>
                                ${Object.entries(categoriesData).map(([catKey, category]) => 
                                    `<option value="${catKey}" ${!isNew && catKey === product.category ? 'selected' : ''}>${category.name?.ar || 'غير معروف'}</option>`
                                ).join('')}
                            </select>
                        </div>

                        <div>
                            <label>السعر ($)</label>
                            <input type="number" name="price" value="${isNew ? '' : product.price || 0}" min="0" step="any" required>
                        </div>

                        <div>
                            <label>الكمية المتاحة</label>
                            <input type="number" name="quantity" value="${isNew ? '0' : product.quantity || 0}" min="0" required>
                        </div>

                        <div>
                            <label>ترتيب العرض</label>
                            <input type="number" name="order" value="${isNew ? '1' : product.order || 1}" min="1" required>
                        </div>

                        <div>
                            <label>لون الخلفية</label>
                            <input type="color" name="color" value="${isNew ? '#ffffff' : product.color || '#ffffff'}">
                        </div>

                        <div>
                            <label>لون النص</label>
                            <input type="color" name="text_color" value="${isNew ? '#000000' : product.textColor || '#000000'}">
                        </div>

                        <div class="full">
                            <label>صور المنتج</label>
                            <div class="images-preview" id="productImagesPreview"></div>

                            <div style="display:flex;justify-content:center;margin-top:10px">
                                <button type="button" class="btn add"><i class="fas fa-plus"></i> إضافة صور</button>
                                <input type="file" id="productImagesInput" accept="image/*" multiple style="display: none">
                            </div> 

                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="grid-btn save">
                            <i class="fas fa-save"></i> ${isNew ? 'إضافة' : 'حفظ'}
                        </button>
                        <button type="button" class="grid-btn close">إلغاء</button>
                    </div>
                </form>
            </div>
        `;

        // إضافة المستمعين للأحداث
        modal.querySelector('.modal-close-unified').addEventListener('click', () => {
        modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                modalRoot.style.display = 'none';
            }, 300);
        });

        const imagesPreview = modal.querySelector('#productImagesPreview');
        currentImages = isNew ? [] : (product.images || []);
        imagesToDelete = [];

        function refreshImagesPreview() {
            imagesPreview.innerHTML = '';
            currentImages.forEach((img, index) => {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'img-thumb';
                imgContainer.innerHTML = `
                    <img src="${img.url}" alt="${img.alt || 'صورة المنتج'}">
                    <div class="remove" data-index="${index}"><i class="fas fa-times"></i></div>
                `;
                imagesPreview.appendChild(imgContainer);
            });
        }
        refreshImagesPreview();

        modal.querySelector('.add').addEventListener('click', () => {
            modal.querySelector('#productImagesInput').click();
        });

        modal.querySelector('#productImagesInput').addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;

            try {
                const uploadedImages = await uploadImages(files);
                currentImages = [...currentImages, ...uploadedImages];
                refreshImagesPreview();
                utils.showToast('تم إضافة الصور بنجاح');
            } catch (error) {
                console.error('خطأ في رفع الصور:', error);
                utils.showToast('حدث خطأ أثناء رفع الصور', 'error');
            } finally {
                e.target.value = '';
            }
        });

        imagesPreview.addEventListener('click', (e) => {
            if (e.target.closest('.remove')) {
                const index = parseInt(e.target.closest('.remove').dataset.index);
                const imageToDelete = currentImages[index];
                if (imageToDelete.public_id) {
                    imagesToDelete.push(imageToDelete);
                }
                currentImages.splice(index, 1);
                refreshImagesPreview();
                utils.showToast('تم حذف الصورة');
            }
        });

       modal.querySelector('.save').addEventListener('click', async () => {
    const form = modal.querySelector('#editProductForm');
    const fd = new FormData(form);

    if (!fd.get('title_ar') || !fd.get('title_en') || !fd.get('category') || !fd.get('price')) {
        utils.showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }

    // التحقق من عدم تكرار المنتج (للإضافة الجديدة فقط)
    if (isNew) {
        const titleAr = fd.get('title_ar').trim();
        const titleEn = fd.get('title_en').trim();
        
        const isDuplicate = Object.values(productsData).some(product => 
            product.title?.ar?.trim() === titleAr && 
            product.title?.en?.trim() === titleEn
        );

        if (isDuplicate) {
            utils.showToast('هذا المنتج موجود بالفعل!', 'error');
            return;
        }
    }

    const productData = {
        title: {
            ar: fd.get('title_ar') || '',
            en: fd.get('title_en') || ''
        },
        description: {
            ar: fd.get('desc_ar') || '',
            en: fd.get('desc_en') || ''
        },
        tags: {
            ar: fd.get('tags_ar') ? fd.get('tags_ar').split(',').map(t => t.trim()).filter(t => t) : [],
            en: fd.get('tags_en') ? fd.get('tags_en').split(',').map(t => t.trim()).filter(t => t) : []
        },
        category: fd.get('category') || '',
        price: parseFloat(fd.get('price')) || 0,
        quantity: parseInt(fd.get('quantity')) || 0,
        order: parseInt(fd.get('order')) || 1,
        color: fd.get('color') || '#ffffff',
        textColor: fd.get('text_color') || '#000000',
        images: currentImages
    };

    try {
        if (isNew) {
            await push(productsRef, productData);
            utils.showToast('تم إضافة المنتج بنجاح');
        } else {
            await update(child(productsRef, key), productData);

            if (imagesToDelete.length > 0) {
                await deleteImages(imagesToDelete);
                imagesToDelete = [];
            }
            utils.showToast('تم حفظ التعديلات بنجاح');
        }

        modal.style.opacity = '0';
        setTimeout(() => {
            modal.remove();
            modalRoot.style.display = 'none';
            renderProductsGrid();
        }, 300);
    } catch (error) {
        console.error('خطأ في الحفظ:', error);
        utils.showToast('حدث خطأ أثناء الحفظ: ' + error.message, 'error');
    }
});


        modalRoot.innerHTML = '';
        modalRoot.appendChild(modal);
        utils.setupModalClose(modal, modalRoot);
    }

    // حذف منتج
    async function deleteProduct(key) {
        if (!confirm('هل أنت متأكد من حذف هذا المنتج؟ سيتم حذف الصور أيضًا.')) return;

        try {
            const projRef = child(productsRef, key);
            const snap = await get(projRef);

            if (!snap.exists()) {
                utils.showToast('المنتج غير موجود!', 'error');
                return;
            }

            const data = snap.val();
            if (data.images && data.images.length > 0) {
                await deleteImages(data.images);
            }

            await remove(projRef);
            utils.showToast('تم حذف المنتج بنجاح');
            renderProductsGrid();
        } catch (error) {
            console.error('خطأ في حذف المنتج:', error);
            utils.showToast('حدث خطأ أثناء حذف المنتج', 'error');
        }
    }

    // البحث
    function performSearch() {
    searchQuery = searchInput.value.trim();
    renderProductsGrid(); 
    }

    if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', performSearch);
    
    // السماح بالبحث عند الضغط على Enter
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    }

    addProductBtn.addEventListener('click', () => {
        openProductModal();
    });

    // التهيئة الأولية
    function initialize() {
        setupJSONImport();
        setupFilterEventListeners();

        onValue(categoriesRef, (snapshot) => {
            categoriesData = snapshot.val() || {};
            renderFilters();
            renderProductsGrid();
        });

        onValue(productsRef, (snapshot) => {
            productsData = snapshot.val() || {};
            renderProductsGrid();
        });

        const addFirstProductBtn = document.getElementById('addFirstProductBtn');
        if (addFirstProductBtn) {
            addFirstProductBtn.addEventListener('click', () => {
                openProductModal();
            });
        }
    }

    initialize();
}

// ==================== قسم الأقسام ====================
function initCategoriesSection() {
    const { categoriesRef } = getFirebaseRefs();
    const categoriesGrid = document.getElementById('categoriesGrid');
    const searchInput = document.getElementById('categoriesSearch');
    const searchBtn = document.getElementById('categoriesSearchBtn');
    const modalRoot = document.getElementById('categoriesModalRoot');
    const addCategoryBtn = document.getElementById('addCategoryBtn');

    let currentCategoryKey = null;
    let categoriesData = {};
    let searchQuery = '';

    // عرض الأقسام في الشبكة
    function renderCategoriesGrid() {
        try {
            categoriesGrid.innerHTML = '';
            
           if (Object.keys(categoriesData).length === 0) {
                emptyStateManager.showEmptyState('categories');
                return;
            }
            
            const filteredCategories = Object.entries(categoriesData).filter(([key, category]) => {
                if (searchQuery) {
                    const searchText = searchQuery.toLowerCase();
                    const categoryText = (
                        (category.name?.ar || '') + 
                        (category.name?.en || '')
                    ).toLowerCase();
                    
                    if (!categoryText.includes(searchText)) {
                        return false;
                    }
                }
                
                return true;
            });
            
            if (filteredCategories.length === 0) {
                emptyStateManager.showSearchEmptyState('categories');
                return;
            } else {
                emptyStateManager.hideEmptyState('categories');
            }
            
            filteredCategories.sort(([, a], [, b]) => (a.order || 0) - (b.order || 0));
            
            filteredCategories.forEach(([key, category]) => {
                const card = document.createElement('div');
                card.className = 'grid-card';
                card.dataset.id = key;
                
                card.innerHTML = `
                    <div class="grid-meta">
                        <div style="min-width:0">
                            <h3>${category.name?.ar || 'بدون اسم'}</h3>
                            <small class="muted">${category.name?.en || 'No name'}</small>
                        </div>
                    </div>
                    <div class="grid-meta">
                        <div>
                            <span class="order-badge"> الترتيب=  ${category.order || 0}</span>
                        </div>
                        <div class="icon-badge" style="background: #3498db;">
                            <i class="${category.icon || 'fas fa-tag'}"></i>
                        </div>
                    </div>
                    <div class="grid-actions">
                        <button class="grid-btn edit"><i class="fas fa-edit"></i> تعديل</button>
                        <button class="grid-btn danger del"><i class="fas fa-trash"></i> حذف </button>
                    </div>
                `;
                
                card.querySelector('.edit').addEventListener('click', () => editCategory(key));
                card.querySelector('.del').addEventListener('click', () => deleteCategory(key));
                
                categoriesGrid.appendChild(card);
            });
            
        } catch (error) {
            console.error('خطأ في عرض الأقسام:', error);
            utils.showToast('حدث خطأ أثناء تحميل البيانات', 'error');
        }
    }

    // فتح نافذة إضافة/تعديل القسم
    function openCategoryModal(key = null, category = null) {
        const isNew = key === null;
        modalRoot.style.display = 'block';
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        modal.innerHTML = `
            <div class="modal-content-new" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
                ${utils.createModalHeader(isNew ? 'إضافة قسم' : 'تعديل قسم', 'fas fa-list')}
                
                <form id="editCategoryForm">
                    <div class="form-compact-new">
                        <div>
                            <label>اسم القسم (عربي) *</label>
                            <input name="name_ar" value="${isNew ? '' : utils.escapeHtml(category.name?.ar || '')}" required>
                        </div>
                        <div>
                            <label>اسم القسم (إنجليزي) *</label>
                            <input name="name_en" value="${isNew ? '' : utils.escapeHtml(category.name?.en || '')}" required>
                        </div>

                        <div class="full">
                            <label>الأيقونة</label>
                            <div id="iconGridContainer" style="max-height: 200px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 8px; padding: 10px;"></div>
                        </div>

                        <div>
                            <label>ترتيب العرض</label>
                            <input type="number" name="order" value="${isNew ? '1' : category.order || 1}" min="0">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="grid-btn save">
                            <i class="fas fa-save"></i> ${isNew ? 'إضافة' : 'حفظ'}
                        </button>
                        <button type="button" class="grid-btn close">إلغاء</button>
                    </div>
                </form>
            </div>
        `;

        // إضافة شبكة الأيقونات
        const iconGridContainer = modal.querySelector('#iconGridContainer');
        const initialIcon = isNew ? 'fas fa-tag' : (category.icon || 'fas fa-tag');
        const { container: iconGrid, getSelectedIcon } = createIconGrid(initialIcon);
        iconGridContainer.appendChild(iconGrid);

        // إضافة المستمعين للأحداث
        modal.querySelector('.modal-close-unified').addEventListener('click', () => {
        modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                modalRoot.style.display = 'none';
            }, 300);
        });

        // حفظ التعديلات
        modal.querySelector('.save').addEventListener('click', async () => {
            const form = modal.querySelector('#editCategoryForm');
            const fd = new FormData(form);

            // التحقق من الحقول المطلوبة
            if (!fd.get('name_ar') || !fd.get('name_en')) {
                utils.showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
                return;
            }

            const categoryData = {
                name: {
                    ar: fd.get('name_ar') || '',
                    en: fd.get('name_en') || ''
                },
                icon: getSelectedIcon(),
                order: parseInt(fd.get('order')) || 1
            };
            
            try {
                if (isNew) {
                    await push(categoriesRef, categoryData);
                    utils.showToast('تم إضافة القسم بنجاح');
                } else {
                    await update(child(categoriesRef, key), categoryData);
                    utils.showToast('تم حفظ التعديلات بنجاح');
                }
                
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.remove();
                    modalRoot.style.display = 'none';
                    renderCategoriesGrid();
                }, 300);
            } catch (error) {
                console.error('خطأ في الحفظ:', error);
                utils.showToast('حدث خطأ أثناء الحفظ: ' + error.message, 'error');
            }
        });

        modalRoot.innerHTML = '';
        modalRoot.appendChild(modal);
        utils.setupModalClose(modal, modalRoot);
    }

    // تعديل قسم
    async function editCategory(key) {
        try {
            const snap = await get(child(categoriesRef, key));
            const category = snap.val();
            openCategoryModal(key, category);
        } catch (error) {
            console.error('خطأ في تحرير القسم:', error);
            utils.showToast('حدث خطأ أثناء تحميل بيانات القسم', 'error');
        }
    }

    // حذف قسم
    async function deleteCategory(key) {
        if (!confirm('هل أنت متأكد من حذف هذا القسم؟')) return;
        
        try {
            await remove(child(categoriesRef, key));
            renderCategoriesGrid();
            utils.showToast('تم حذف القسم بنجاح');
        } catch (error) {
            console.error('خطأ في الحذف:', error);
            utils.showToast('حدث خطأ أثناء الحذف: ' + error.message, 'error');
        }
    }

    // البحث
    const performSearch = () => {
       searchQuery = searchInput.value.trim().toLowerCase();
       renderCategoriesGrid();
    };
   
    if (searchBtn && searchInput) {
       searchBtn.addEventListener('click', performSearch);
    }

    // إضافة قسم جديد
    addCategoryBtn.addEventListener('click', () => {
        openCategoryModal();
    });

    // التهيئة الأولية
    function initialize() {
        onValue(categoriesRef, (snapshot) => {
            categoriesData = snapshot.val() || {};
            renderCategoriesGrid();
        });
    }

    initialize();
}

// ==================== قسم الطلبات  ====================
function initOrdersSection() {
    const { ordersRef, productsRef, categoriesRef } = getFirebaseRefs();
    const ordersGrid = document.getElementById('ordersGrid');
    const searchInput = document.getElementById('ordersSearch');
    const searchBtn = document.getElementById('ordersSearchBtn');
    const statusFilter = document.getElementById('orderStatusFilter');
    const modalRoot = document.getElementById('orderModalRoot');
    const orderTpl = document.getElementById('orderCardTpl');

    if (!ordersGrid || !orderTpl) return;

    const totalOrdersEl = document.getElementById('total-orders');
    const newOrdersEl = document.getElementById('new-orders');
    const confirmedOrdersEl = document.getElementById('confirmed-orders');
    const processingOrdersEl = document.getElementById('processing-orders');
    const shippedOrdersEl = document.getElementById('shipped-orders');
    const completedOrdersEl = document.getElementById('completed-orders');
    const cancelledOrdersEl = document.getElementById('cancelled-orders');

    let currentOrderKey = null;
    let ordersData = {};
    let productsData = {};
    let categoriesData = {};
    let searchQuery = '';
    let selectedStatus = 'all';

    // ======== دوال مساعدة محسنة ========
    function getOrderStatusText(status) {
        const statusMap = {
            'new': 'جديد',
            'confirmed': 'تم التأكيد', 
            'processing': 'قيد التجهيز',
            'shipped': 'تم الشحن',
            'completed': 'تم التسليم',
            'cancelled': 'ملغي'
        };
        return statusMap[status] || 'جديد';
    }

    function getPaymentMethodText(paymentMethod) {
        const paymentMap = {
            'cash': 'الدفع عند الاستلام',
            'paymob': 'الدفع الإلكتروني',
            'cash_on_delivery': 'الدفع عند الاستلام',
            'online': 'الدفع الإلكتروني',
            'credit_card': 'بطاقة ائتمان',
            'bank_transfer': 'تحويل بنكي'
        };
        return paymentMap[paymentMethod] || paymentMethod || 'الدفع عند الاستلام';
    }
    
    function normalizePaymentMethod(order) {
        if (!order) return 'cash_on_delivery';
        
        const payment = order.paymentMethod || order.payment || '';
        const paymentLower = payment.toLowerCase();
        
        if (paymentLower.includes('cash') || paymentLower.includes('delivery') || 
            paymentLower.includes('نقدي') || paymentLower.includes('استلام') ||
            paymentLower.includes('كاش')) {
            return 'cash_on_delivery';
        } else if (paymentLower.includes('online') || paymentLower.includes('electronic') || 
                   paymentLower.includes('paymob') || paymentLower.includes('credit') || 
                   paymentLower.includes('إلكتروني') || paymentLower.includes('بايموب') ||
                   paymentLower.includes('pay') || paymentLower.includes('electronic')) {
            return 'paymob';
        } else if (paymentLower.includes('bank') || paymentLower.includes('تحويل')) {
            return 'bank_transfer';
        }
        
        return 'cash_on_delivery';
    }

    // ======== تحديث إحصائيات الطلبات ========
    function updateOrderStatistics() {
        if (!ordersData) return;
    
        let total = 0;
        let newOrders = 0;
        let confirmed = 0;
        let processing = 0;
        let shipped = 0;
        let completed = 0;
        let cancelled = 0;
    
        Object.values(ordersData).forEach(order => {
            if (!order) return;
            
            total++;
            const status = utils.normalizeOrderStatus(order);
            
            switch (status) {
                case 'new':
                    newOrders++;
                    break;
                case 'confirmed':
                    confirmed++;
                    break;
                case 'processing':
                    processing++;
                    break;
                case 'shipped':
                    shipped++;
                    break;
                case 'completed':
                    completed++;
                    break;
                case 'cancelled':
                    cancelled++;
                    break;
            }
        });
    
        // تحديث جميع العناصر
        if (totalOrdersEl) totalOrdersEl.textContent = total;
        if (newOrdersEl) newOrdersEl.textContent = newOrders;
        if (processingOrdersEl) processingOrdersEl.textContent = processing;
        if (completedOrdersEl) completedOrdersEl.textContent = completed;
        
        // العناصر الجديدة
        const confirmedOrdersEl = document.getElementById('confirmed-orders');
        const shippedOrdersEl = document.getElementById('shipped-orders');
        const cancelledOrdersEl = document.getElementById('cancelled-orders');
        
        if (confirmedOrdersEl) confirmedOrdersEl.textContent = confirmed;
        if (shippedOrdersEl) shippedOrdersEl.textContent = shipped;
        if (cancelledOrdersEl) cancelledOrdersEl.textContent = cancelled;
    }

    // ======== تحميل البيانات الأولية ========
    async function loadInitialData() {
        try {
            const [ordersSnap, productsSnap, categoriesSnap] = await Promise.all([
                get(ordersRef),
                get(productsRef),
                get(categoriesRef)
            ]);

            ordersData = utils.optimizeLargeData(ordersSnap.val() || {});
            productsData = utils.optimizeLargeData(productsSnap.val() || {});
            categoriesData = utils.optimizeLargeData(categoriesSnap.val() || {});
            
            updateOrderStatistics();
            renderOrdersGrid();
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
            utils.showToast('حدث خطأ أثناء تحميل بيانات الطلبات', 'error');
        }
    }

    // ======== عرض الطلبات في الشبكة ========
    function renderOrdersGrid() {
         if (!ordersGrid) return;

    ordersGrid.innerHTML = '';
    
    if (!ordersData || Object.keys(ordersData).length === 0) {
        emptyStateManager.showEmptyState('orders');
        return;
    }
    
    const filteredOrders = Object.entries(ordersData).filter(([key, order]) => {
        if (!order) return false;
        
        const normalizedStatus = utils.normalizeOrderStatus(order);
        
        // الفلتر يدعم جميع الحالات الجديدة
        if (selectedStatus !== 'all' && normalizedStatus !== selectedStatus) {
            return false;
        }
        
        if (searchQuery) {
            const searchText = searchQuery.toLowerCase();
            const orderText = (
                (order.name || '') + 
                (order.phone || '') + 
                (order.location || order.address || '') +
                (order.orderId || '') +
                (order.message || '')
            ).toLowerCase();
            
            if (!orderText.includes(searchText)) {
                return false;
            }
        }
        
        return true;
        });

        if (filteredOrders.length === 0) {
            emptyStateManager.showSearchEmptyState('orders');
            return;
        } else {
            emptyStateManager.hideEmptyState('orders');
        }
           
        // ترتيب الطلبات حسب التاريخ (الأحدث أولاً)
        filteredOrders.sort(([, a], [, b]) => {
            const timeA = a.timestamp || a.createdAt || 0;
            const timeB = b.timestamp || b.createdAt || 0;
            return timeB - timeA;
        });

        utils.renderChunked(filteredOrders, ordersGrid, ([key, order]) => {
            if (!orderTpl) return null;

           const orderDate = new Date(order.timestamp || order.createdAt || Date.now());
           const day = orderDate.getDate().toString().padStart(2, '0');
           const month = (orderDate.getMonth() + 1).toString().padStart(2, '0');
           const year = orderDate.getFullYear();
           const formattedDate = `${day}/${month}/${year}`;

            const normalizedStatus = utils.normalizeOrderStatus(order);
            const normalizedPayment = normalizePaymentMethod(order);
            
            const statusClass = `status-${normalizedStatus}`;
            const statusText = getOrderStatusText(normalizedStatus);

            const paymentText = getPaymentMethodText(normalizedPayment);
            const paymentClass = `payment-${normalizedPayment}`;

            const node = orderTpl.content.cloneNode(true);
            const cardEl = node.querySelector('.order-card-new');

            // تعبئة البيانات
            const orderNoElement = node.querySelector('.order-no');
            const orderDateElement = node.querySelector('.order-date');
            const custNameElement = node.querySelector('.cust-name');
            const custPhoneElement = node.querySelector('.cust-phone');
            const orderTotalElement = node.querySelector('.order-total');
            const statusPill = node.querySelector('.status-pill');
            const paymentPill = node.querySelector('.payment-pill');

            if (orderNoElement) orderNoElement.textContent = `#${order.orderId || key.substr(-6)}`;
            if (orderDateElement) orderDateElement.textContent = formattedDate;
            if (custNameElement) custNameElement.textContent = order.name || 'غير معروف';
            if (custPhoneElement) custPhoneElement.textContent = order.phone || 'غير معروف';
            if (orderTotalElement) orderTotalElement.textContent = (order.total || 0).toFixed(2);
            
            if (statusPill) {
                statusPill.className = `status-pill ${statusClass}`;
                statusPill.textContent = statusText;
            }
            
            if (paymentPill) {
                paymentPill.className = `payment-pill ${paymentClass}`;
                paymentPill.textContent = paymentText;
            }

            // إضافة مستمعي الأحداث
            const detailsBtn = node.querySelector('.details-btn');
            const waBtn = node.querySelector('.wa-btn');

            if (detailsBtn) {
                detailsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openOrderModal(key, order);
                });
            }

            if (waBtn && order.phone) {
                waBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleWhatsAppReply(order, key);
                });
            }

            // فتح المودال عند النقر على البطاقة
            cardEl.addEventListener('click', (e) => {
                if (!e.target.closest('.card-buttons')) {
                    openOrderModal(key, order);
                }
            });

            return cardEl;
        });
    }

    // ======== عرض منتجات الطلب ========
    function renderOrderProducts(products) {
        if (!products) return '<p class="no-products">لا توجد منتجات في هذا الطلب</p>';
        
        let html = '';
        
        // التعامل مع كل من المصفوفة والكائن
        const productsArray = Array.isArray(products) ? products : Object.values(products);
        
        productsArray.forEach((item, index) => {
            const product = productsData[item.id] || item;
            const productName = product.title ? (product.title.ar || product.title.en || 'منتج غير معروف') : (product.name || 'منتج غير معروف');
            const productPrice = product.price || item.price || 0;
            const quantity = item.quantity || 1;
            const subtotal = item.subtotal || (productPrice * quantity);
            const imageUrl = product.image || (product.images && product.images[0] ? product.images[0].url : '') || item.image || '';
            
            html += `
                <div class="order-product-item">
                    <div class="product-image">
                        ${imageUrl ? 
                            `<img src="${imageUrl}" alt="${productName}" onerror="this.style.display='none'">` : 
                            `<div class="no-image"><i class="fas fa-image"></i></div>`
                        }
                    </div>
                    <div class="product-details">
                        <h4 class="product-name">${utils.escapeHtml(productName)}</h4>
                        <div class="product-meta">
                            <span class="product-price">السعر: ${productPrice.toFixed(2)} ${item.currency || 'ج.م'}</span>
                            <span class="product-quantity">الكمية: ${quantity}</span>
                            <span class="product-subtotal">المجموع: ${subtotal.toFixed(2)} ${item.currency || 'ج.م'}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        return html;
    }

    // ======== فتح مودال تفاصيل الطلب ========
    function openOrderModal(key, order) {
        if (!modalRoot) return;
        
        currentOrderKey = key;
        modalRoot.style.display = 'block';
        
        const normalizedStatus = utils.normalizeOrderStatus(order);
        const normalizedPayment = normalizePaymentMethod(order);
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        modal.innerHTML = `
            <div class="modal-content-new" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
                ${utils.createModalHeader('تفاصيل الطلب', 'fas fa-shopping-bag')}
                
                <div class="order-details-content">
                    <!-- معلومات العميل -->
                    <div class="details-section">
                        <h3 class="section-title">
                            <i class="fas fa-user"></i> معلومات العميل
                        </h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>الاسم:</label>
                                <span>${utils.escapeHtml(order.name || 'غير معروف')}</span>
                            </div>
                            <div class="info-item">
                                <label>الهاتف:</label>
                                <span>${utils.escapeHtml(order.phone || 'غير معروف')}</span>
                            </div>
                            <div class="info-item">
                                <label>العنوان:</label>
                                <span>${utils.escapeHtml(order.location || order.address || 'غير محدد')}</span>
                            </div>
                            <div class="info-item">
                                <label>رقم الطلب:</label>
                                <span>#${order.orderId || key.substr(-6)}</span>
                            </div>
                            <div class="info-item">
                                <label>طريقة الدفع:</label>
                                <span>${getPaymentMethodText(normalizedPayment)}</span>
                            </div>
                            <div class="info-item">
                                <label>الإجمالي:</label>
                                <span class="total-amount">${(order.total || 0).toFixed(2)} ${order.currency || 'ج.م'}</span>
                            </div>
                            ${order.message ? `
                            <div class="info-item">
                                <label>الرسالة:</label>
                                <span>${utils.escapeHtml(order.message)}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- المنتجات -->
                    <div class="details-section">
                        <h3 class="section-title">
                            <i class="fas fa-box"></i> المنتجات 
                            ${order.products ? `(${Object.keys(order.products).length})` : '(0)'}
                        </h3>
                        <div class="products-list" id="orderProductsList">
                            ${renderOrderProducts(order.products)}
                        </div>
                    </div>
                    <!-- الوقت المتوقع للاستلام -->
                    <div class="details-section">
                        <div class="timeline-control-group">
                            <h3 class="section-title">
                                <i class="fas fa-clock"></i> الوقت المتوقع للاستلام 
                            </h3>
                            <div class="timeline-controls">
                                <input type="datetime-local" 
                                    id="estimatedDeliveryInput" 
                                    class="form-control"
                                    value="${order.estimatedDelivery ? formatDateTimeForInput(order.estimatedDelivery) : ''}">
                                <button class="grid-btn primary save" id="saveDeliveryEstimate">
                                    <i class="fas fa-save"></i> حفظ
                                </button>
                            </div>
                        </div>
                    </div>
                    <!-- التايم لاين المحسن -->
                    <div class="details-section">
                        <h3 class="section-title">
                            <i class="fas fa-stream"></i> متابعة الطلب
                        </h3>
                        <div class="enhanced-timeline">   
                            <!-- مراحل التايم لاين -->
                            <div class="timeline-steps-container">
                                <div class="timeline-steps-grid">
                                    ${renderEnhancedTimelineSteps(order.timeline || {})}
                                </div>
                            </div>
                        </div>
                    </div>
    
                    <!-- إدارة الطلب -->      
                    <div class="order-management-actions">
                        <div class="action-buttons-grid">
                            <button class="grid-btn cancel-order">
                                <i class="fas fa-times-circle"></i> إلغاء الطلب
                            </button>
                            <button class="grid-btn  delete-order">
                                <i class="fas fa-trash"></i> حذف الطلب
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    
        // إضافة مستمعي الأحداث
        modal.querySelector('.modal-close-unified').addEventListener('click', () => {
            closeOrderModal(modal);
        });
    
        // حفظ الوقت المتوسط للتسليم
        modal.querySelector('#saveDeliveryEstimate').addEventListener('click', async () => {
            await saveDeliveryEstimate(key);
        });
    
        // إلغاء الطلب
        const cancelOrderBtn = modal.querySelector('.cancel-order');
        if (cancelOrderBtn) {
        // إزالة أي مستمعات سابقة أولاً
        cancelOrderBtn.replaceWith(cancelOrderBtn.cloneNode(true));
        const newCancelBtn = modal.querySelector('.cancel-order');
    
        newCancelBtn.addEventListener('click', () => {
        // منع إلغاء الطلب إذا كان مكتملاً
        if (normalizedStatus === 'completed') {
            utils.showToast('لا يمكن إلغاء طلب تم تسليمه بالفعل', 'error');
            return;
        }
        
        if (confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) {
            updateOrderStatus(key, 'cancelled');
            closeOrderModal(modal);
        }
        });
        }
    
        // حذف الطلب
        modal.querySelector('.delete-order').addEventListener('click', () => {
            if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
                deleteOrder(key);
                closeOrderModal(modal);
            }
        });
    
        // إغلاق بالنقر خارج المحتوى
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeOrderModal(modal);
            }
        });
    
        modalRoot.innerHTML = '';
        modalRoot.appendChild(modal);
        utils.setupModalClose(modal, modalRoot);
    }
    
    // ======== عرض مراحل التايم لاين المحسن ========
    function renderEnhancedTimelineSteps(timeline) {
        const steps = [
            {
                key: 'ordered',
                icon: 'fas fa-shopping-cart',
                label: 'تم الطلب',
                description: 'وقت استلام الطلب'
            },
            {
                key: 'confirmed', 
                icon: 'fas fa-check-circle',
                label: 'تم التأكيد',
                description: 'تأكيد الطلب من الإدارة'
            },
            {
                key: 'processing',
                icon: 'fas fa-cog', 
                label: 'قيد التجهيز',
                description: 'بدء تجهيز الطلب'
            },
            {
                key: 'shipped',
                icon: 'fas fa-shipping-fast',
                label: 'تم الشحن', 
                description: 'شحن الطلب للعميل'
            },
            {
                key: 'delivered',
                icon: 'fas fa-home',
                label: 'تم التسليم',
                description: 'تسليم الطلب للعميل'
            }
        ];
    
        let html = '';
        
        steps.forEach(step => {
            const stepTime = timeline && timeline[step.key];
            const isCompleted = !!stepTime;
            const formattedTime = stepTime ? formatDateTimeForDisplay(stepTime) : 'لم يتم بعد';
            
            html += `
                <div class="enhanced-timeline-step ${isCompleted ? 'completed' : ''}">
                    <div class="step-indicator">
                        <div class="step-icon">
                            <i class="${step.icon}"></i>
                        </div>
                        <div class="step-line"></div>
                    </div>
                    <div class="step-content">
                        <div class="step-header">
                            <h5 class="step-title">${step.label}</h5>
                            <span class="step-time">${formattedTime}</span>
                        </div>
                        <p class="step-description">${step.description}</p>
                        <div class="step-action">
                            <button class="timeline-btn ${isCompleted ? 'completed-btn' : 'pending-btn'}" 
                                    onclick="updateTimelineStep('${currentOrderKey}', '${step.key}')">
                                <i class="fas ${isCompleted ? 'fa-check' : 'fa-play'}"></i>
                                ${isCompleted ? 'تم' : 'بدء'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        return html;
    }
    
    async function saveDeliveryEstimate(key) {
        const input = document.getElementById('estimatedDeliveryInput');
        if (!input || !input.value) {
            utils.showToast('الرجاء إدخال موعد التسليم المتوسط', 'error');
            return;
        }
        
        try {
            const deliveryTime = new Date(input.value).getTime();
            await update(child(ordersRef, key), {
                estimatedDelivery: deliveryTime
            });
            
            utils.showToast('تم حفظ الموعد المتوسط للتسليم بنجاح');
        } catch (error) {
            console.error('خطأ في حفظ الموعد المتوسط:', error);
            utils.showToast('حدث خطأ أثناء حفظ الموعد المتوسط', 'error');
        }
    }

    async function updateTimelineStep(orderKey, stepKey) {
        try {
            const currentTime = Date.now();
            
            // الحصول على بيانات الطلب الحالية
            const orderSnap = await get(child(ordersRef, orderKey));
            const order = orderSnap.val();
            if (!order) {
                utils.showToast('الطلب غير موجود', 'error');
                return;
            }
    
            const timeline = order.timeline || {};
            
            // تعريف ترتيب المراحل (من الأقدم إلى الأحدث)
            const timelineOrder = ['ordered', 'confirmed', 'processing', 'shipped', 'delivered'];
            
            // الحصول على أحدث مرحلة مكتملة
            let latestCompletedStep = '';
            let latestStepIndex = -1;
            
            for (const step of timelineOrder) {
                if (timeline[step]) {
                    latestCompletedStep = step;
                    latestStepIndex = timelineOrder.indexOf(step);
                }
            }
            
            // إذا لم تكن هناك أي مرحلة مكتملة، نبدأ من ordered
            if (latestStepIndex === -1) {
                latestStepIndex = -1; // سيكون ordered هي الخطوة الأولى (index 0)
            }
            
            const targetStepIndex = timelineOrder.indexOf(stepKey);
            
            // التحقق إذا كانت المرحلة مكتملة بالفعل
            if (timeline[stepKey]) {
                utils.showToast(` ${getStepLabel(stepKey)} - هذه المرحلة مكتملة بالفعل`, 'info');
                return;
            }
            
            // التحقق من أن المرحلة المطلوبة ليست سابقة للمرحلة الحالية
            if (targetStepIndex <= latestStepIndex) {
                utils.showToast(' لا يمكن الرجوع إلى مرحلة سابقة!', 'error');
                return;
            }
            
            // التحقق من أن المرحلة المطلوبة هي التالية مباشرة
            if (targetStepIndex !== latestStepIndex + 1) {
                const currentStepName = latestStepIndex >= 0 ? getStepLabel(timelineOrder[latestStepIndex]) : 'بداية';
                const nextStepName = getStepLabel(timelineOrder[latestStepIndex + 1]);
                utils.showToast(` يجب إكمال مرحلة "${nextStepName}" أولاً (المرحلة الحالية: ${currentStepName})`, 'info');
                return;
            }
    
            // تحديث التايم لاين
            const timelineUpdate = {};
            timelineUpdate[`timeline/${stepKey}`] = currentTime;
            
            // تحديث حالة الطلب بناءً على الخطوة
            let statusUpdate = {};
            switch(stepKey) {
                case 'ordered':
                    statusUpdate.status = 'new';
                    break;
                case 'confirmed':
                    statusUpdate.status = 'confirmed';
                    break;
                case 'processing':
                    statusUpdate.status = 'processing';
                    break;
                case 'shipped':
                    statusUpdate.status = 'shipped';
                    break;
                case 'delivered':
                    statusUpdate.status = 'completed';
                    break;
            }
            
            // تحديث البيانات في Firebase
            await update(ref(db, `storeOrders/${orderKey}`), {
                ...timelineUpdate,
                ...statusUpdate,
                updatedAt: currentTime
            });
            
            utils.showToast(` تم تحديث حالة ${getStepLabel(stepKey)} بنجاح`);
            
            // إعادة تحميل البيانات لتحديث الواجهة
            const ordersSnap = await get(ordersRef);
            ordersData = utils.optimizeLargeData(ordersSnap.val() || {});
            
            // إعادة فتح المودال لتحديث البيانات
            if (currentOrderKey === orderKey) {
                const order = ordersData[orderKey];
                if (order) {
                    setTimeout(() => {
                        openOrderModal(orderKey, order);
                    }, 500);
                }
            }
            
        } catch (error) {
            console.error('خطأ في تحديث حالة التايم لاين:', error);
            utils.showToast('حدث خطأ أثناء التحديث: ' + error.message, 'error');
        }
    }

    function getStepLabel(stepKey) {
        const labels = {
            'ordered': 'الطلب',
            'confirmed': 'التأكيد',
            'processing': 'التجهيز',
            'shipped': 'الشحن',
            'delivered': 'التسليم'
        };
        return labels[stepKey] || stepKey;
    }

    function formatDateTimeForInput(timestamp) {
        const date = new Date(timestamp);
        return date.toISOString().slice(0, 16);
    }

    function formatDateTimeForDisplay(timestamp) {
        const date = new Date(timestamp);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

    // ======== إغلاق مودال الطلب ========
    function closeOrderModal(modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.remove();
            modalRoot.style.display = 'none';
            currentOrderKey = null;
        }, 300);
    }

    // ======== تحديث حالة الطلب ========
    async function updateOrderStatus(key, newStatus) {
        try {
            await update(child(ordersRef, key), {
                status: newStatus,
                updatedAt: Date.now()
            });
            
            utils.showToast('تم تحديث حالة الطلب بنجاح');
            updateOrderStatistics();
            renderOrdersGrid();
        } catch (error) {
            console.error('خطأ في تحديث حالة الطلب:', error);
            utils.showToast('حدث خطأ أثناء تحديث حالة الطلب', 'error');
        }
    }

    // ======== الرد عبر واتساب ========
    function handleWhatsAppReply(order, orderKey) {
        if (!order.phone) {
            utils.showToast('لا يوجد رقم هاتف للعميل', 'error');
            return;
        }

        const phone = order.phone.replace(/\D/g, '');
        if (!phone) {
            utils.showToast('رقم الهاتف غير صالح', 'error');
            return;
        }

        // إنشاء رسالة الرد مع فاتورة الطلب
        const message = createWhatsAppMessage(order, orderKey);
        const encodedMessage = encodeURIComponent(message);
        
        window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
    }

    // ======== إنشاء رسالة الرد مع الفاتورة ========
    function createWhatsAppMessage(order, orderKey) {
        let message = `مرحباً ${order.name || 'عميلنا العزيز'} 👋\n\n`;
        message += `تم استلام طلبك بنجاح (#${order.orderId || orderKey.substr(-6)}) وسيتم تجهيزه في أقرب وقت ممكن.\n\n`;
        message += `*تفاصيل طلبك:*\n`;
        message += `📍 العنوان: ${order.location || order.address || 'غير محدد'}\n`;
        message += `💰 الإجمالي: ${(order.total || 0).toFixed(2)} ${order.currency || 'ج.م'}\n`;
        message += `💳 طريقة الدفع: ${getPaymentMethodText(normalizePaymentMethod(order))}\n\n`;
        
        message += `*المنتجات:*\n`;
        if (order.products) {
            const productsArray = Array.isArray(order.products) ? order.products : Object.values(order.products);
            productsArray.forEach((item, index) => {
                const product = productsData[item.id] || item;
                const productName = product.title ? (product.title.ar || product.title.en || 'منتج غير معروف') : (product.name || 'منتج غير معروف');
                const quantity = item.quantity || 1;
                const price = item.price || product.price || 0;
                message += `${index + 1}. ${productName} - ${quantity} × ${price.toFixed(2)} = ${(price * quantity).toFixed(2)}\n`;
            });
        }
        
        message += `\n*الإجمالي النهائي: ${(order.total || 0).toFixed(2)} ${order.currency || 'ج.م'}*\n\n`;
        message += `شكراً لثقتك بنا 🤍\nسنقوم بالتواصل معك قريباً لتأكيد التفاصيل.`;
        
        return message;
    }

    // ======== حذف الطلب ========
    async function deleteOrder(key) {
        if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;
        
        try {
            await remove(child(ordersRef, key));
            utils.showToast('تم حذف الطلب بنجاح');
            updateOrderStatistics();
            renderOrdersGrid();
        } catch (error) {
            console.error('خطأ في حذف الطلب:', error);
            utils.showToast('حدث خطأ أثناء حذف الطلب', 'error');
        }
    }

    // ======== إعداد مستمعي الأحداث ========
    function setupEventListeners() {
        const performSearch = () => {
        searchQuery = searchInput.value.trim().toLowerCase();
        renderOrdersGrid();
        };

        if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', performSearch);
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', function() {
                selectedStatus = this.value;
                renderOrdersGrid();
            });
        }
    }

    // ======== التهيئة الرئيسية ========
    function initialize() {
        setupEventListeners();
        loadInitialData();

        emptyStateManager.createEmptyState('orders');

        // الاستماع للتحديثات في الوقت الحقيقي
        onValue(ordersRef, (snapshot) => {
            ordersData = utils.optimizeLargeData(snapshot.val() || {});
            updateOrderStatistics();
            renderOrdersGrid();
        });

        onValue(productsRef, (snapshot) => {
            productsData = utils.optimizeLargeData(snapshot.val() || {});
        });

        onValue(categoriesRef, (snapshot) => {
            categoriesData = utils.optimizeLargeData(snapshot.val() || {});
        });
    }

    // جعل الدوال متاحة globally لاستدعائها من الأزرار في الـ HTML
    window.updateTimelineStep = updateTimelineStep;
    
    initialize();
}
// ==================== قسم البوت ====================
function initBotSection() {
    console.log('🔧 تهيئة قسم البوت - البدء');
    
    const { responsesRef } = getFirebaseRefs();
    const botGrid = document.getElementById('botGrid');
    const searchInput = document.getElementById('botSearch');
    const categoryFilter = document.getElementById('botCategoryFilter');
    const searchBtn = document.getElementById('botSearchBtn');
    const modalRoot = document.getElementById('botModalRoot');
    const addBotBtn = document.getElementById('addBotBtn');
    const addFirstBotBtn = document.getElementById('addFirstBotBtn');
    const importBotJsonBtn = document.getElementById('importBotJsonBtn');
    const botJsonFileInput = document.getElementById('botJsonFileInput');

    // عناصر الإحصائيات المعدلة
    const totalBotResponsesEl = document.getElementById('totalBotResponses');
    const welcomeResponsesEl = document.getElementById('welcomeResponses');

    if (!botGrid) {
        console.error('❌ عنصر botGrid غير موجود في DOM');
        return;
    }

    let currentResponseKey = null;
    let responsesData = {};
    let searchQuery = '';
    let selectedCategory = 'all';

    // ======== التهيئة الأولية ========
    function initialize() {
        console.log('🔄 بدء التهيئة...');
        
        setupEventListeners();
        setupBotJSONImport();
        updateCategoryFilter(); // تحديث الفلتر
        loadBotData();
        
        console.log('✅ قسم البوت جاهز للاستخدام');
    }

    // ======== تحديث فلتر التصنيفات ========
    function updateCategoryFilter() {
        if (!categoryFilter) return;
        
        // إعادة تعيين الفلتر ليكون فقط "الكل" و "الترحيبية"
        categoryFilter.innerHTML = `
            <option value="all">الكل</option>
            <option value="welcome">الترحيبية</option>
        `;
        
        selectedCategory = 'all';
    }

    // ======== إعداد مستمعي الأحداث ========
    function setupEventListeners() {
        // البحث
        const performSearch = () => {
        searchQuery = searchInput ? searchInput.value.trim() : '';
        console.log('🔍 بحث:', searchQuery);
        renderBotGrid();
        };

        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', performSearch);
        }

        // التصفية حسب التصنيف
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                selectedCategory = categoryFilter.value;
                console.log('🏷️ تصنيف:', selectedCategory);
                renderBotGrid();
            });
        }

        // إضافة رد جديد
        if (addBotBtn) {
            addBotBtn.addEventListener('click', () => {
                console.log('➕ زر إضافة رد جديد');
                openBotModal();
            });
        }

        // إضافة أول رد (من شاشة لا توجد نتائج)
        if (addFirstBotBtn) {
            addFirstBotBtn.addEventListener('click', () => {
                openBotModal();
            });
        }
    }

    // ======== استيراد JSON للبوت ========
    function setupBotJSONImport() {
        if (!importBotJsonBtn || !botJsonFileInput) {
            console.warn('⚠️ أزرار استيراد JSON غير موجودة');
            return;
        }
        
        importBotJsonBtn.addEventListener('click', () => {
            console.log('📁 زر استيراد JSON تم النقر عليه');
            botJsonFileInput.click();
        });
        
        botJsonFileInput.addEventListener('change', function(event) {
            console.log('📁 تغيير في اختيار الملف');
            handleBotJSONFileUpload(event).catch(error => {
                console.error('❌ خطأ في معالجة الملف:', error);
                utils.showToast('حدث خطأ في معالجة الملف: ' + error.message, 'error');
            });
        });
    }

    async function handleBotJSONFileUpload(event) {
        const file = event.target.files[0];
        if (!file) {
            console.log('❌ لم يتم اختيار ملف');
            return;
        }
        
        console.log('📁 ملف مختار:', file.name, 'بحجم:', file.size, 'نوع:', file.type);
        
        event.target.value = '';
        
        try {
            const responses = await readBotJSONFile(file);
            console.log('📊 تم قراءة ملف JSON، عدد الردود:', responses.length);
            await importBotResponsesFromJSON(responses);
        } catch (error) {
            utils.handleJSONImportError(error);
        }
    }

    function readBotJSONFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    console.log('📖 جاري تحليل محتوى JSON...');
                    const data = JSON.parse(e.target.result);
                    
                    let responses;
                    if (Array.isArray(data)) {
                        responses = data;
                    } else if (data.responses && Array.isArray(data.responses)) {
                        responses = data.responses;
                    } else if (typeof data === 'object') {
                        responses = [data];
                    } else {
                        throw new Error('تنسيق JSON غير مدعوم');
                    }
                    
                    console.log('✅ تم تحليل JSON بنجاح:', responses);
                    resolve(responses);
                } catch (error) {
                    console.error('❌ خطأ في parsing JSON:', error);
                    reject(new Error('ملف JSON غير صالح - ' + error.message));
                }
            };
            
            reader.onerror = (error) => {
                console.error('❌ خطأ في قراءة الملف:', error);
                reject(new Error('فشل في قراءة الملف'));
            };

            reader.readAsText(file);
        });
    }

    async function importBotResponsesFromJSON(responsesArray) {
        console.log('🔄 بدء استيراد الردود من JSON...');
        
        if (!Array.isArray(responsesArray)) {
            throw new Error('يجب أن يحتوي ملف JSON على مصفوفة من ردود البوت');
        }

        if (responsesArray.length === 0) {
            throw new Error('ملف JSON فارغ');
        }
        
        const progressBar = utils.createProgressBar('استيراد ردود البوت', 'fas fa-robot');
        
        let importedCount = 0;
        let duplicateCount = 0;
        let errorCount = 0;
        const errors = [];
        const duplicates = [];
        
        try {
            console.log(`📦 جاري استيراد ${responsesArray.length} رد...`);
            
            for (const [index, responseData] of responsesArray.entries()) {
                try {
                    utils.updateProgressBar(progressBar, index, responsesArray.length);
                    
                    console.log(`🔄 معالجة الرد ${index + 1} من ${responsesArray.length}`);
                    
                    // التحقق من البيانات الأساسية
                    if (!responseData.question_ar && !responseData.question_en) {
                        const errorMsg = `الرد ${index + 1}: يفتقر إلى السؤال العربي أو الإنجليزي`;
                        errors.push(errorMsg);
                        errorCount++;
                        continue;
                    }
                    
                    // معالجة التصنيف - تحويل جميع التصنيفات القديمة إلى "عام"
                    let category = (responseData.category || 'general').toString().trim().toLowerCase();
                    
                    // إذا كان التصنيف ليس "welcome"، حوله إلى "general"
                    if (category !== 'welcome') {
                        category = 'general';
                    }
                    
                    const questionAr = (responseData.question_ar || '').toString().trim();
                    const questionEn = (responseData.question_en || '').toString().trim();
                    
                    const isDuplicate = Object.values(responsesData).some(response => 
                        (response.question?.ar || '').trim() === questionAr && 
                        (response.question?.en || '').trim() === questionEn
                    );

                    if (isDuplicate) {
                        console.log(`⏭️ تخطي رد مكرر: ${questionAr}`);
                        duplicates.push(questionAr);
                        duplicateCount++;
                        continue;
                    }
                    
                    // إعداد بيانات الرد
                    const response = {
                        question: {
                            ar: questionAr,
                            en: questionEn
                        },
                        response: {
                            ar: (responseData.response_ar || '').toString().trim(),
                            en: (responseData.response_en || '').toString().trim()
                        },
                        category: category, // استخدام التصنيف المعدل
                        keywords: processKeywords(responseData.keywords),
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    };
                    
                    // إضافة الترتيب فقط للردود الترحيبية
                    if (response.category === 'welcome') {
                        response.order = parseInt(responseData.order) || 1;
                    }
                    
                    console.log(`💾 حفظ الرد: ${response.question.ar} (${response.category})`);
                    
                    const newResponseRef = await push(responsesRef, response);
                    importedCount++;
                    
                    responsesData[newResponseRef.key] = response;
                    
                    console.log(`✅ تم استيراد الرد ${index + 1} بنجاح`);
                    
                    if (importedCount % 10 === 0) {
                        utils.showToast(`تم استيراد ${importedCount} من ${responsesArray.length} رد...`, 'info');
                    }

                } catch (error) {
                    const errorMsg = `الرد ${index + 1}: ${error.message}`;
                    console.error(`❌ ${errorMsg}`);
                    errors.push(errorMsg);
                    errorCount++;
                }

                await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            utils.completeProgressBar(progressBar);
            
            console.log(`🎯 اكتمل الاستيراد: ${importedCount} نجاح, ${duplicateCount} مكرر, ${errorCount} فشل`);
            
            showImportResults(importedCount, duplicateCount, errorCount, errors, duplicates);
            
        } catch (error) {
            console.error('❌ خطأ عام في الاستيراد:', error);
            utils.removeProgressBar(progressBar);
            throw error;
        }
    }

    function processKeywords(keywordsData) {
        if (!keywordsData) return [];
        
        if (Array.isArray(keywordsData)) {
            return keywordsData.map(k => k.toString().trim()).filter(k => k);
        }
        
        if (typeof keywordsData === 'string') {
            return keywordsData.split(',').map(k => k.trim()).filter(k => k);
        }
        
        return [];
    }

    function showImportResults(importedCount, duplicateCount, errorCount, errors, duplicates) {
        let message = `تم استيراد ${importedCount} رد للبوت بنجاح`;
        let type = 'success';
        
        if (duplicateCount > 0) {
            message += `, تم تخطي ${duplicateCount} رد مكرر`;
        }
        
        if (errorCount > 0) {
            message += `, مع ${errorCount} أخطاء`;
            type = 'error';
        }
        
        utils.showToast(message, type);
        
        if (duplicates.length > 0) {
            console.log('📋 الردود المكررة التي تم تخطيها:', duplicates);
        }
        
        if (errors.length > 0) {
            console.warn('❌ أخطاء الاستيراد:', errors);
        }
        
        if (importedCount > 0) {
            renderBotGrid();
        }
    }

    // ======== تحميل وعرض بيانات البوت ========
    function loadBotData() {
        console.log('🔄 جاري تحميل بيانات البوت...');
        
        onValue(responsesRef, (snapshot) => {
            const data = snapshot.val() || {};
            console.log('✅ بيانات البوت المحملة:', Object.keys(data).length, 'رد');
            
            responsesData = utils.optimizeLargeData(data);
            updateBotStatistics();
            renderBotGrid();
        }, (error) => {
            console.error('❌ خطأ في تحميل بيانات البوت:', error);
            utils.showToast('حدث خطأ في تحميل بيانات البوت', 'error');
            showErrorState(error);
        });
    }

    function updateBotStatistics() {
        if (!responsesData) return;
        
        const responses = Object.values(responsesData);
        const total = responses.length;
        const welcome = responses.filter(r => r.category === 'welcome').length;
        
        if (totalBotResponsesEl) totalBotResponsesEl.textContent = total;
        if (welcomeResponsesEl) welcomeResponsesEl.textContent = welcome;
    }

    function renderBotGrid() {
        try {
            console.log('🔄 جاري عرض بيانات البوت...');
            botGrid.innerHTML = '';
            
            if (!responsesData || Object.keys(responsesData).length === 0) {
                emptyStateManager.showEmptyState('bot');
                return;
            }
            
            let filteredResponses = Object.entries(responsesData);
            
            // التصفية حسب التصنيف - فقط "الكل" و "الترحيبية"
            if (selectedCategory !== 'all') {
                filteredResponses = filteredResponses.filter(([key, response]) => 
                    response.category === selectedCategory
                );
            }
            
            // البحث
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                filteredResponses = filteredResponses.filter(([key, response]) => {
                    const searchText = (
                        (response.question?.ar || '') + 
                        (response.question?.en || '') + 
                        (response.response?.ar || '') + 
                        (response.response?.en || '') + 
                        (response.keywords?.join(' ') || '')
                    ).toLowerCase();
                    
                    return searchText.includes(query);
                });
            }
            
            if (filteredResponses.length === 0) {
                emptyStateManager.showSearchEmptyState('bot');
                return;
            } else {
                emptyStateManager.hideEmptyState('bot');
            }
            
            // الترتيب - الترحيبية أولاً ثم الباقي
            filteredResponses.sort(([, a], [, b]) => {
                if (a.category === 'welcome' && b.category === 'welcome') {
                    return (a.order || 0) - (b.order || 0);
                }
                if (a.category === 'welcome') return -1;
                if (b.category === 'welcome') return 1;
                
                return (b.createdAt || 0) - (a.createdAt || 0);
            });
            
            // العرض
            filteredResponses.forEach(([key, response]) => {
                const card = createBotResponseCard(key, response);
                botGrid.appendChild(card);
            });
            
            console.log('✅ تم عرض بيانات البوت بنجاح');
            
        } catch (error) {
            console.error('❌ خطأ في عرض ردود البوت:', error);
            utils.showToast('حدث خطأ أثناء تحميل البيانات', 'error');
        }
    }

    function createBotResponseCard(key, response) {
        const card = document.createElement('div');
        card.className = 'grid-card';
        card.dataset.id = key;
        
        const categoryBadge = getCategoryBadge(response.category);
        const keywordsText = response.keywords && response.keywords.length > 0 
            ? response.keywords.join(', ') 
            : 'لا توجد كلمات مفتاحية';
        
        card.innerHTML = `
            <div class="grid-meta">
                <div style="min-width:0">
                    <h3>${utils.escapeHtml(response.question?.ar || 'بدون سؤال')}</h3>
                    <small class="muted">${utils.escapeHtml(response.question?.en || 'No question')}</small>
                </div>
            </div>
            <div class="grid-meta">
                <div>
                    <span class="category-badge-bot"><i class="fas fa-folder"></i>${categoryBadge}</span>
                </div>
                <div>
                    ${response.order ? `<span class="order-badge"><i class="fas fa-sort"></i> ترتيب = ${response.order}</span>` : ''}
                </div>
            </div>
            <div class="grid-meta">
                <div>
                    <small>
                        <div class="keywords-container">
                            ${response.keywords && response.keywords.length > 0 
                                ? response.keywords.map(keyword => 
                                    `<span class="keyword-tag">${utils.escapeHtml(keyword)}</span>`
                                    ).join('')
                                : '<span class="no-keywords">لا توجد كلمات مفتاحية</span>'
                            }
                        </div>
                    </small>
                </div>
            </div>
            <div class="grid-actions">
                <button class="grid-btn edit" title="تعديل الرد">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="grid-btn danger del" title="حذف الرد">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        `;
        
        card.querySelector('.edit').addEventListener('click', (e) => {
            e.stopPropagation();
            editResponse(key);
        });
        
        card.querySelector('.del').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteResponse(key);
        });
        
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.grid-actions')) {
                editResponse(key);
            }
        });
        
        return card;
    }

    function getCategoryBadge(category) {
        const badges = {
            'welcome': { text: 'ترحيبية', class: 'welcome-badge' },
            'general': { text: 'عام', class: 'general-badge' }
        };
        
        const badge = badges[category] || { text: category, class: 'default-badge' };
        return `<span class="category-badge ${badge.class}">${badge.text}</span>`;
    }

    // ======== إدارة الردود (إضافة/تعديل/حذف) ========
    function openBotModal(key = null, response = null) {
        const isNew = key === null;
        if (!modalRoot) {
            console.error('❌ modalRoot غير موجود');
            return;
        }
        
        modalRoot.style.display = 'block';
        currentResponseKey = key;
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        modal.innerHTML = `
            <div class="modal-content-new" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
                ${utils.createModalHeader(isNew ? 'إضافة رد بوت' : 'تعديل رد بوت', 'fas fa-robot')}
                
                <form id="editBotForm" class="modal-form">
                    <div class="form-compact-new">
                        <div class="form-section">
                            <h4><i class="fas fa-question-circle"></i> السؤال</h4>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="question_ar">السؤال (عربي) *</label>
                                    <input type="text" id="question_ar" name="question_ar" 
                                           value="${isNew ? '' : utils.escapeHtml(response.question?.ar || '')}" 
                                           placeholder="أدخل السؤال باللغة العربية" required>
                                </div>
                                <div class="form-group">
                                    <label for="question_en">السؤال (إنجليزي)</label>
                                    <input type="text" id="question_en" name="question_en" 
                                           value="${isNew ? '' : utils.escapeHtml(response.question?.en || '')}" 
                                           placeholder="Enter question in English">
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h4><i class="fas fa-reply"></i> الرد</h4>
                            <div class="form-row">
                                <div class="form-group full">
                                    <label for="response_ar">الرد (عربي)</label>
                                    <textarea id="response_ar" name="response_ar" rows="3" 
                                              placeholder="أدخل الرد باللغة العربية">${isNew ? '' : utils.escapeHtml(response.response?.ar || '')}</textarea>
                                </div>
                                <div class="form-group full">
                                    <label for="response_en">الرد (إنجليزي)</label>
                                    <textarea id="response_en" name="response_en" rows="3" 
                                              placeholder="Enter response in English">${isNew ? '' : utils.escapeHtml(response.response?.en || '')}</textarea>
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h4><i class="fas fa-cog"></i> الإعدادات</h4>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="category">التصنيف *</label>
                                    <select id="category" name="category" required>
                                        <option value="general" ${!isNew && response.category === 'general' ? 'selected' : ''}>عام</option>
                                        <option value="welcome" ${!isNew && response.category === 'welcome' ? 'selected' : ''}>ترحيبية</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="order">ترتيب الظهور</label>
                                    <input type="number" id="order" name="order" 
                                           value="${isNew ? '1' : response.order || 1}" 
                                           min="1" max="100"
                                           ${isNew || response.category !== 'welcome' ? 'disabled' : ''}>
                                    <small style="color: #666;">مفعل فقط للردود الترحيبية</small>
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <h4><i class="fas fa-key"></i> الكلمات المفتاحية</h4>
                            <div class="form-group full">
                                <label for="keywords">الكلمات المفتاحية</label>
                                <input type="text" id="keywords" name="keywords" 
                                       value="${isNew ? '' : (response.keywords ? response.keywords.join(', ') : '')}" 
                                       placeholder="أدخل الكلمات المفتاحية مفصولة بفواصل">
                                <small style="color: #666;">استخدم كلمات مفتاحية متعددة لفعالية أفضل في البحث</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="grid-btn save">
                            <i class="fas fa-save"></i> ${isNew ? 'إضافة' : 'حفظ'}
                        </button>
                        <button type="button" class="grid-btn close">إلغاء</button>
                    </div>
                </form>
            </div>
        `;

        // تفعيل/تعطيل حقل الترتيب بناءً على التصنيف
        const categorySelect = modal.querySelector('#category');
        const orderInput = modal.querySelector('#order');
        
        function toggleOrderInput() {
            orderInput.disabled = categorySelect.value !== 'welcome';
        }
        
        categorySelect.addEventListener('change', toggleOrderInput);
        toggleOrderInput();

        modal.querySelector('.modal-close-unified').addEventListener('click', () => {
        modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                modalRoot.style.display = 'none';
            }, 300);
        });

        modal.querySelector('.save').addEventListener('click', handleSave);

        function closeModal() {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                modalRoot.style.display = 'none';
                currentResponseKey = null;
            }, 300);
        }

        async function handleSave() {
            const form = modal.querySelector('#editBotForm');
            const formData = new FormData(form);

            if (!formData.get('question_ar') || !formData.get('category')) {
                utils.showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
                return;
            }

            const questionAr = formData.get('question_ar').trim();
            const questionEn = formData.get('question_en').trim();
            
            if (isNew) {
                const isDuplicate = Object.values(responsesData).some(response => 
                    response.question?.ar?.trim() === questionAr && 
                    response.question?.en?.trim() === questionEn
                );

                if (isDuplicate) {
                    utils.showToast('هذا الرد موجود بالفعل!', 'error');
                    return;
                }
            }

            const responseData = {
                question: {
                    ar: questionAr,
                    en: questionEn
                },
                response: {
                    ar: formData.get('response_ar') || '',
                    en: formData.get('response_en') || ''
                },
                category: formData.get('category') || 'general',
                keywords: formData.get('keywords') ? 
                    formData.get('keywords').split(',').map(k => k.trim()).filter(k => k) : [],
                updatedAt: Date.now()
            };
            
            if (formData.get('category') === 'welcome') {
                responseData.order = parseInt(formData.get('order')) || 1;
            }
            
            if (isNew) {
                responseData.createdAt = Date.now();
            }
            
            try {
                if (isNew) {
                    await push(responsesRef, responseData);
                    utils.showToast('تم إضافة الرد بنجاح');
                } else {
                    await update(child(responsesRef, currentResponseKey), responseData);
                    utils.showToast('تم حفظ التعديلات بنجاح');
                }
                
                closeModal();
            } catch (error) {
                console.error('❌ خطأ في الحفظ:', error);
                utils.showToast('حدث خطأ أثناء الحفظ: ' + error.message, 'error');
            }
        }

        modalRoot.innerHTML = '';
        modalRoot.appendChild(modal);
        utils.setupModalClose(modal, modalRoot);
    }

    async function editResponse(key) {
        try {
            const snap = await get(child(responsesRef, key));
            if (!snap.exists()) {
                utils.showToast('الرد غير موجود', 'error');
                return;
            }
            
            const response = snap.val();
            openBotModal(key, response);
        } catch (error) {
            console.error('❌ خطأ في تحرير الرد:', error);
            utils.showToast('حدث خطأ أثناء تحميل بيانات الرد', 'error');
        }
    }

    async function deleteResponse(key) {
        if (!confirm('هل أنت متأكد من حذف هذا الرد؟')) return;
        
        try {
            await remove(child(responsesRef, key));
            utils.showToast('تم حذف الرد بنجاح');
        } catch (error) {
            console.error('❌ خطأ في الحذف:', error);
            utils.showToast('حدث خطأ أثناء الحذف: ' + error.message, 'error');
        }
    }

    // بدء التهيئة
    initialize();
}

// ==================== قسم رسائل العملاء ====================
function initCustomerMessagesSection() {
    console.log('🚀 بدء تحميل قسم رسائل العملاء');
    
    const { messagesRef } = getFirebaseRefs();
    const grid = document.getElementById('messagesGrid');
    const tpl = document.getElementById('messageTpl');

    if (!grid) {
        console.error('❌ عنصر messagesGrid غير موجود');
        return;
    }

    // مسح الشبكة أولاً وعرض "لا توجد رسائل"
    grid.innerHTML = '';
    showEmptyState();

    const msgModal = document.getElementById('messageModal');
    const modalSender = document.getElementById('modalSender');
    const modalTime = document.getElementById('modalTime');
    const modalMessage = document.getElementById('modalMessage');
    const modalClose = document.querySelector('#messageModal .modal-close');
    const modalMarkRead = document.getElementById('modalMarkRead');

    // إحصائيات الرسائل
    const totalMessagesEl = document.getElementById('total-messages');
    const newMessagesEl = document.getElementById('new-messages');

    // عناصر الفلترة
    const statusFilter = document.getElementById('messageStatusFilter');
    const timeFilter = document.getElementById('messageTimeFilter');
    const searchInput = document.getElementById('messageSearch');
    const searchBtn = document.getElementById('messageSearchBtn');

    let messagesData = {};
    let filteredMessages = [];
    let currentMessageKey = null;

    // ======== دوال مساعدة ========
    function getContactType(contact) {
        if (!contact) return 'unknown';
        const cleanContact = contact.trim();
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(cleanContact)) return 'email';
        
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
        if (phoneRegex.test(cleanContact.replace(/[\s\-\(\)]/g, ''))) return 'phone';
        
        return 'unknown';
    }
    
    function preparePhoneNumber(phone) {
        if (!phone) return '';
        let cleanPhone = phone.replace(/\D/g, '');
        
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '20' + cleanPhone.substring(1);
        } else if (!cleanPhone.startsWith('20') && cleanPhone.length === 10) {
            cleanPhone = '20' + cleanPhone;
        }
        
        return cleanPhone;
    }
    
    function createReplyLink(message) {
        const contact = message.fullPhone || message.contact || '';
        const contactType = getContactType(contact);
        const replyMessage = createAutoReplyMessage(message);
        
        if (contactType === 'phone') {
            const phoneNumber = preparePhoneNumber(contact);
            if (phoneNumber) {
                return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(replyMessage)}`;
            }
        } else if (contactType === 'email') {
            const subject = `رد على استفسارك - ${message.name || 'عميلنا العزيز'}`;
            return `mailto:${contact}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(replyMessage)}`;
        }
        
        return null;
    }

    function createAutoReplyMessage(message) {
        let replyMessage = `مرحباً ${message.name || 'عميلنا العزيز'}! 👋\n\n`;
        replyMessage += `شكراً لتواصلك معنا 😊\n`;
        replyMessage += `تم استلام رسالتك بنجاح وسيتم الرد عليك في أقرب وقت ممكن.\n\n`;
        replyMessage += `رسالتك:\n"${message.message || 'لا توجد رسالة'}"\n\n`;
        replyMessage += `مع فائق التحية والتقدير،\nفريق الدعم الفني 💙`;
        
        return replyMessage;
    }

    function openMsgModal() {
        if (msgModal) {
            msgModal.style.display = 'flex';
            msgModal.setAttribute('aria-hidden', 'false');
        }
    }

    function closeMsgModal() {
        if (msgModal) {
            msgModal.style.display = 'none';
            msgModal.setAttribute('aria-hidden', 'true');
        }
    }

    // === دوال حالة العناصر الفارغة ===
    function showEmptyState() {
        grid.innerHTML = `
            <div class="empty-state-container show" id="customer-messagesNoResults">
                <div class="empty-state-content">
                    <div class="empty-state-icon">
                        <i class="fas fa-comments"></i>
                    </div>
                    <h3 class="empty-state-title">لا توجد رسائل</h3>
                    <p class="empty-state-message">لم يتم استلام أي رسائل من العملاء حتى الآن.</p>
                </div>
            </div>
        `;
    }

    function showSearchEmptyState() {
        grid.innerHTML = `
            <div class="empty-state-container show" id="customer-messagesNoResults">
                <div class="empty-state-content">
                    <div class="empty-state-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <h3 class="empty-state-title">لا توجد نتائج</h3>
                    <p class="empty-state-message">لم نعثر على أي رسائل تطابق بحثك.</p>
                </div>
            </div>
        `;
    }

    function hideEmptyState() {
        const emptyState = document.getElementById('customer-messagesNoResults');
        if (emptyState) {
            emptyState.remove();
        }
    }

    // مستمعي الأحداث للإغلاق
    if (modalClose) {
        modalClose.addEventListener('click', closeMsgModal);
    }
    
    if (msgModal) {
        msgModal.addEventListener('click', (e) => { 
            if (e.target === msgModal) closeMsgModal(); 
        });
    }
    
    document.addEventListener('keydown', (e) => { 
        if (e.key === 'Escape') closeMsgModal(); 
    });

    // تحميل الرسائل من Firebase
    onValue(messagesRef, (snapshot) => {
        messagesData = snapshot.val() || {};
        console.log('📨 عدد الرسائل المستلمة:', Object.keys(messagesData).length);
        applyFilters();
        updateMessageStats();
    });

    function updateMessageStats() {
        const messages = Object.values(messagesData);
        if (totalMessagesEl) totalMessagesEl.textContent = messages.length;

        const newCount = messages.filter(m => m && m.status === 'new').length;
        if (newMessagesEl) newMessagesEl.textContent = newCount;
    }

    function applyFilters() {
        const status = statusFilter ? statusFilter.value : 'all';
        const timePeriod = timeFilter ? timeFilter.value : 'all';
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

        filteredMessages = Object.entries(messagesData).filter(([key, message]) => {
            if (!message) return false;

            // فلترة الحالة
            if (status !== 'all' && message.status !== status) return false;

            // فلترة الوقت
            if (timePeriod !== 'all') {
                const now = new Date();
                const messageDate = new Date(message.timestamp);

                if (timePeriod === 'today') {
                    return messageDate.toDateString() === now.toDateString();
                } else if (timePeriod === 'week') {
                    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                    return messageDate >= startOfWeek;
                } else if (timePeriod === 'month') {
                    return messageDate.getMonth() === now.getMonth() &&
                           messageDate.getFullYear() === now.getFullYear();
                }
            }

            // فلترة البحث
            if (searchTerm) {
                const matchesSearch = 
                    (message.name && message.name.toLowerCase().includes(searchTerm)) ||
                    (message.message && message.message.toLowerCase().includes(searchTerm)) ||
                    (message.contact && message.contact.toLowerCase().includes(searchTerm));
                
                if (!matchesSearch) return false;
            }

            return true;
        });

        renderMessages();
    }

    function renderMessages() {
        grid.innerHTML = '';

        if (filteredMessages.length === 0) {
            if (Object.keys(messagesData).length === 0) {
                showEmptyState();
            } else {
                showSearchEmptyState();
            }
            return;
        }

        // ترتيب الرسائل حسب التاريخ (الأحدث أولاً)
        filteredMessages.sort((a, b) => {
            const timeA = a[1].timestamp || a[1].createdAt || 0;
            const timeB = b[1].timestamp || b[1].createdAt || 0;
            return timeB - timeA;
        });

        filteredMessages.forEach(([key, m]) => {
            if (!m) return;

            const messageDate = new Date(m.timestamp || m.createdAt || Date.now());
            const day = messageDate.getDate().toString().padStart(2, '0');
            const month = (messageDate.getMonth() + 1).toString().padStart(2, '0');
            const year = messageDate.getFullYear();
            const formattedDate = `${day}/${month}/${year}`;

            const timeAgo = utils.getTimeAgo ? utils.getTimeAgo(messageDate) : formattedDate;
            
            const node = tpl.content.cloneNode(true);
            const cardEl = node.querySelector('.message-card-new');
            
            if (!cardEl) return;
            
            // تعبئة البيانات
            const nameEl = node.querySelector('.msg-name');
            const contactEl = node.querySelector('.msg-contact');
            const dateEl = node.querySelector('.msg-date');
            const statusEl = node.querySelector('.msg-status');
            const previewEl = node.querySelector('.msg-preview');
            
            if (nameEl) nameEl.textContent = m.name || 'بدون اسم';
            if (contactEl) {
                const displayContact = m.fullPhone || m.contact || 'بدون اتصال';
                contactEl.textContent = displayContact;
            }
            if (dateEl) dateEl.textContent = formattedDate;
            
            // تحديث حالة الرسالة
            if (statusEl) {
                statusEl.textContent = m.status === 'new' ? 'جديدة' : 'تم الرد';
                statusEl.className = `msg-status status-${m.status || 'new'}`;
            }

            // نص المعاينة
            const maxChars = 100;
            if (previewEl) {
                if (m.message && m.message.length > maxChars) {
                    previewEl.textContent = m.message.slice(0, maxChars).trim() + '...';
                } else {
                    previewEl.textContent = m.message || 'لا توجد رسالة';
                }
            }

            // أزرار البطاقة
            const replyBtn = node.querySelector('.reply-btn');
            const deleteBtn = node.querySelector('.delete-msg');
            
            if (replyBtn) {
                replyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleReply(m);
                });
            }

            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
                        deleteMessage(key);
                    }
                });
            }

            // فتح المودال عند النقر على البطاقة
            cardEl.addEventListener('click', () => {
                openMessageModal(key, m);
            });

            grid.appendChild(node);
        });
    }
    
    function openMessageModal(key, message) {
        if (!message) return;
        
        currentMessageKey = key;
        
        const messageDate = new Date(message.timestamp || message.createdAt || Date.now());
        const timeAgo = utils.getTimeAgo ? utils.getTimeAgo(messageDate) : messageDate.toLocaleString();
        
        if (modalSender) modalSender.textContent = message.name || 'بدون اسم';
        if (modalTime) modalTime.textContent = timeAgo;
        if (modalMessage) modalMessage.textContent = message.message || 'لا توجد رسالة';
        
        if (modalMarkRead) {
            modalMarkRead.style.display = 'none';
        }
        
        openMsgModal();
    }

    function handleReply(message) {
        const contact = message.fullPhone || message.contact;
        
        if (!contact) {
            utils.showToast('لا توجد معلومات اتصال للرد', 'error');
            return;
        }
        
        const replyLink = createReplyLink(message);
        
        if (replyLink) {
            window.open(replyLink, '_blank');
            
            if (message.status !== 'replied') {
                markMessageAsReplied(currentMessageKey);
            }
        } else {
            utils.showToast('نوع جهة الاتصال غير معروف أو غير صالح', 'error');
        }
    }

    function markMessageAsReplied(key) {
        if (messagesData[key] && messagesData[key].status !== 'replied') {
            update(child(messagesRef, key), { status: 'replied' })
                .then(() => {
                    utils.showToast('تم تحديث حالة الرسالة إلى "تم الرد"');
                    messagesData[key].status = 'replied';
                    applyFilters();
                    updateMessageStats();
                })
                .catch(error => {
                    console.error('خطأ في تحديث حالة الرسالة:', error);
                    utils.showToast('حدث خطأ أثناء التعديل', 'error');
                });
        }
    }

    function deleteMessage(key) {
        remove(child(messagesRef, key))
            .then(() => {
                utils.showToast('تم حذف الرسالة بنجاح');
                delete messagesData[key];
                applyFilters();
                updateMessageStats();
                
                if (currentMessageKey === key) {
                    closeMsgModal();
                    currentMessageKey = null;
                }
            })
            .catch(error => {
                console.error('خطأ في حذف الرسالة:', error);
                utils.showToast('حدث خطأ أثناء الحذف', 'error');
            });
    }

    // مستمعي الأحداث للفلاتر
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    if (timeFilter) {
        timeFilter.addEventListener('change', applyFilters);
    }
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', applyFilters);
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    }

    console.log('✅ قسم رسائل العملاء تم تحميله بنجاح');
}

// ==================== تهيئة التطبيق ====================
document.addEventListener('DOMContentLoaded', function() {
    // إضافة أنماط CSS للحركات إذا لم تكن موجودة
    if (!document.getElementById('dynamic-styles')) {
        const styles = document.createElement('style');
        styles.id = 'dynamic-styles';
        styles.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .notification {
                animation: slideIn 0.3s ease;
            }
            .notification.hiding {
                animation: slideOut 0.3s ease;
            }
        `;
        document.head.appendChild(styles);
    }

    // تهيئة نظام التحميل
    const loadingSystem = new FastLoadingSystem();
    loadingSystem.init();
});

// ==================== تصدير المتغيرات العالمية ====================
window.cloudinaryManager = cloudinaryManager;
window.utils = utils;
window.memoryManager = memoryManager;
window.lazyLoader = lazyLoader;
window.appState = appState;
window.updateOrdersBadgeGlobal = updateOrdersBadgeGlobal;
window.updateMessagesBadgeGlobal = updateMessagesBadgeGlobal;
window.updateSectionNotifications = updateSectionNotifications;
window.emptyStateManager = emptyStateManager;