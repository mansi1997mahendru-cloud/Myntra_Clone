// ==========================================================================
// TECHIE INVOICE GENERATOR - Main Application Script
// Handles user auth (Firebase / Local fallback), Google OAuth, email verification,
// custom validations (Gmail constraints, password rules), Firestore & CRUD.
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // FIREBASE PROJECT CONFIGURATION
    // ----------------------------------------------------
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY_HERE",
        authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT_ID.appspot.com",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
    };

    let isFirebaseConfigured = false;
    let db = null;

    if (
        firebaseConfig.apiKey && 
        firebaseConfig.apiKey !== "YOUR_API_KEY_HERE" && 
        !firebaseConfig.apiKey.includes("API_KEY")
    ) {
        try {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            isFirebaseConfigured = true;
            console.log("Firebase & Firestore initialized successfully.");
        } catch (err) {
            console.error("Firebase failed to initialize. Reverting to Local Sandbox Mode.", err);
        }
    } else {
        console.warn("Firebase credentials are not configured. Running in Local Storage Sandbox mode.");
    }

    const firebaseConfigBanner = document.getElementById('firebase-config-banner');
    if (!isFirebaseConfigured && firebaseConfigBanner) {
        firebaseConfigBanner.style.display = 'flex';
    }

    // ----------------------------------------------------
    // DOM CACHE - AUTHENTICATION SCREEN
    // ----------------------------------------------------
    const authScreen = document.getElementById('auth-screen');
    const tabSigninBtn = document.getElementById('tab-signin-btn');
    const tabSignupBtn = document.getElementById('tab-signup-btn');
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const signinEmailInput = document.getElementById('signin-email');
    const signinPasswordInput = document.getElementById('signin-password');
    
    const signupCompanyInput = document.getElementById('signup-company');
    const signupEmailInput = document.getElementById('signup-email');
    const signupPasswordInput = document.getElementById('signup-password');
    const signupConfirmInput = document.getElementById('signup-confirm-password');
    
    const signinError = document.getElementById('signin-error');
    const signupError = document.getElementById('signup-error');
    const authDesc = document.getElementById('auth-desc');
    const authTabsBar = document.getElementById('auth-tabs-bar');
    
    const googleAuthBtn = document.getElementById('google-auth-btn');
    const authDivider = document.getElementById('auth-divider');

    // Verification screen overlay card elements
    const verificationCard = document.getElementById('verification-card');
    const verifyEmailDisplay = document.getElementById('verify-email-display');
    const verifyError = document.getElementById('verify-error');
    const verifySuccess = document.getElementById('verify-success');
    const verifyRefreshBtn = document.getElementById('verify-refresh-btn');
    const verifyResendBtn = document.getElementById('verify-resend-btn');
    const verifySignoutBtn = document.getElementById('verify-signout-btn');

    // ----------------------------------------------------
    // DOM CACHE - APPLICATION CONTENT
    // ----------------------------------------------------
    const userEmailText = document.getElementById('user-email-text');
    const signoutBtn = document.getElementById('signout-btn');

    const bizLogoInput = document.getElementById('business-logo-input');
    const logoDropzone = document.getElementById('logo-dropzone');
    const logoPreviewImg = document.getElementById('logo-preview-img');
    const removeLogoBtn = document.getElementById('remove-logo-btn');
    const previewLogoContainer = document.getElementById('preview-logo-container');

    const bizNameInput = document.getElementById('biz-name');
    const bizEmailInput = document.getElementById('biz-email');
    const bizPhoneInput = document.getElementById('biz-phone');
    const bizGstInput = document.getElementById('biz-gst');
    const bizAddressInput = document.getElementById('biz-address');

    const clientCompanyInput = document.getElementById('client-company');
    const clientNameInput = document.getElementById('client-name');
    const clientEmailInput = document.getElementById('client-email');
    const clientPhoneInput = document.getElementById('client-phone');
    const clientGstInput = document.getElementById('client-gst');
    const clientAddressInput = document.getElementById('client-address');

    const invoiceNumInput = document.getElementById('invoice-number');
    const currencySelect = document.getElementById('currency-select');
    const invoiceDateInput = document.getElementById('invoice-date');
    const dueDateInput = document.getElementById('due-date');

    const bankDetailsInput = document.getElementById('bank-details');
    const invoiceNotesInput = document.getElementById('invoice-notes');

    const itemsContainer = document.getElementById('items-container');
    const addItemBtn = document.getElementById('add-item-btn');

    const saveInvoiceBtn = document.getElementById('save-invoice-btn');
    const printInvoiceBtn = document.getElementById('print-invoice-btn');
    const resetInvoiceBtn = document.getElementById('reset-invoice-btn');
    const saveDefaultsBtn = document.getElementById('save-profile-defaults');

    const savedInvoicesList = document.getElementById('saved-invoices-list');
    const toast = document.getElementById('toast');

    // ----------------------------------------------------
    // STATE VARIABLES
    // ----------------------------------------------------
    let activeUserEmail = null;
    let activeUserUid = null;
    let invoiceLogoBase64 = null;
    let savedInvoices = [];

    const CURRENCY_SYMBOLS = {
        INR: '₹',
        USD: '$',
        EUR: '€',
        GBP: '£',
        AUD: 'A$'
    };

    // Dates Setup
    const today = new Date().toISOString().split('T')[0];
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 15);
    const fifteenDaysLater = defaultDueDate.toISOString().split('T')[0];

    // ----------------------------------------------------
    // BOOTSTRAP / INITIALIZATION FLOW
    // ----------------------------------------------------
    initAuthHandlers();
    checkActiveSession();

    function checkActiveSession() {
        if (isFirebaseConfigured) {
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    if (user.emailVerified) {
                        loginUserSession(user.email, user.uid);
                    } else {
                        showVerificationScreen(user.email, user.uid);
                    }
                } else {
                    logoutUserSession();
                }
            });
        } else {
            const mockUser = sessionStorage.getItem('techie_active_user_email');
            const mockUid = sessionStorage.getItem('techie_active_user_uid');
            const isMockVerified = sessionStorage.getItem('techie_active_user_verified') === 'true';

            if (mockUser && mockUid) {
                if (isMockVerified) {
                    loginUserSession(mockUser, mockUid);
                } else {
                    showVerificationScreen(mockUser, mockUid);
                }
            } else {
                logoutUserSession();
            }
        }
    }

    function loginUserSession(email, uid) {
        activeUserEmail = email;
        activeUserUid = uid;
        
        sessionStorage.setItem('techie_active_user_email', email);
        sessionStorage.setItem('techie_active_user_uid', uid);
        sessionStorage.setItem('techie_active_user_verified', 'true');

        document.body.classList.remove('auth-active');
        userEmailText.innerText = email;

        // Reset dates
        invoiceDateInput.value = today;
        dueDateInput.value = fifteenDaysLater;

        // Hide verification panel in card if showing
        verificationCard.style.display = 'none';

        // Load isolated user data
        loadBusinessDefaults();
        loadSavedInvoices();
        
        bindRealTimeSync();
        calculateInvoice();
        showToast(`Welcome back, ${email}!`, "success");
    }

    function logoutUserSession() {
        activeUserEmail = null;
        activeUserUid = null;
        
        sessionStorage.removeItem('techie_active_user_email');
        sessionStorage.removeItem('techie_active_user_uid');
        sessionStorage.removeItem('techie_active_user_verified');

        document.body.classList.add('auth-active');

        // Reset Workspace UI fields
        bizNameInput.value = '';
        bizEmailInput.value = '';
        bizPhoneInput.value = '';
        bizGstInput.value = '';
        bizAddressInput.value = '';
        
        clientCompanyInput.value = '';
        clientNameInput.value = '';
        clientEmailInput.value = '';
        clientPhoneInput.value = '';
        clientGstInput.value = '';
        clientAddressInput.value = '';
        
        invoiceNumInput.value = '';
        bankDetailsInput.value = '';
        invoiceNotesInput.value = '';

        removeLogoBtn.click();
        itemsContainer.innerHTML = '';
        savedInvoicesList.innerHTML = '<div class="empty-state">No saved invoices found.</div>';
        
        // Show Google authentication button
        googleAuthBtn.style.display = 'flex';
        authDivider.style.display = 'flex';
    }

    function showVerificationScreen(email, uid) {
        activeUserEmail = email;
        activeUserUid = uid;

        sessionStorage.setItem('techie_active_user_email', email);
        sessionStorage.setItem('techie_active_user_uid', uid);
        sessionStorage.setItem('techie_active_user_verified', 'false');

        document.body.classList.add('auth-active');

        // Hide Signin/Signup forms, tab bars, Google button, and divider
        signinForm.style.display = 'none';
        signupForm.style.display = 'none';
        authTabsBar.style.display = 'none';
        googleAuthBtn.style.display = 'none';
        authDivider.style.display = 'none';
        
        authDesc.innerText = "Email Verification Required";

        // Display verification pending card
        verifyEmailDisplay.innerText = email;
        verificationCard.style.display = 'block';
    }

    // ----------------------------------------------------
    // USER REGISTRATION & PASSWORD VALIDATION
    // ----------------------------------------------------
    function initAuthHandlers() {
        // Tab switching
        tabSigninBtn.addEventListener('click', () => {
            tabSigninBtn.classList.add('active');
            tabSignupBtn.classList.remove('active');
            signinForm.style.display = 'flex';
            signupForm.style.display = 'none';
            signinError.style.display = 'none';
        });

        tabSignupBtn.addEventListener('click', () => {
            tabSignupBtn.classList.add('active');
            tabSigninBtn.classList.remove('active');
            signupForm.style.display = 'flex';
            signinForm.style.display = 'none';
            signupError.style.display = 'none';
        });

        // Sign Up Handler
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            signupError.style.display = 'none';

            const companyName = signupCompanyInput.value.trim();
            const email = signupEmailInput.value.trim().toLowerCase();
            const password = signupPasswordInput.value;
            const confirmPassword = signupConfirmInput.value;

            // 1. Gmail Domain Restriction Check
            if (!email.endsWith('@gmail.com')) {
                showAuthError(signupError, "Sign up is restricted to valid @gmail.com addresses only.");
                return;
            }

            // 2. Starts with alphabetical letter
            const startsWithLetter = /^[a-zA-Z]/;
            if (!startsWithLetter.test(password)) {
                showAuthError(signupError, "Password must start with an alphabetical letter (a-z or A-Z).");
                return;
            }

            // 3. Contains at least one special character
            const specialChars = /[!@#$%^&*(),.?":{}|<>_\-/\\\[\]]/;
            if (!specialChars.test(password)) {
                showAuthError(signupError, "Password must contain at least one special character (e.g. !, @, #, $, %).");
                return;
            }

            // 4. Maximum 8 characters in length
            if (password.length > 8) {
                showAuthError(signupError, "Password is too long (maximum length is 8 characters).");
                return;
            }

            // 5. Confirmation Match
            if (password !== confirmPassword) {
                showAuthError(signupError, "Passwords do not match.");
                return;
            }

            if (isFirebaseConfigured) {
                // Firebase Registration Flow
                firebase.auth().createUserWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        const user = userCredential.user;
                        
                        // Send Firebase verification email
                        user.sendEmailVerification()
                            .then(() => {
                                console.log("Verification email sent to Gmail.");
                            })
                            .catch((err) => {
                                console.error("Error sending verification email:", err);
                            });

                        // Set initial business settings defaults in Firestore
                        const defaults = {
                            name: companyName,
                            email: email,
                            phone: '',
                            gst: '',
                            address: '',
                            logo: null
                        };
                        db.collection('users').doc(user.uid).set({ defaults: defaults }, { merge: true })
                            .catch(err => console.error("Failed to save Firestore register profile:", err));

                        signupForm.reset();
                        showVerificationScreen(email, user.uid);
                    })
                    .catch((err) => {
                        console.error("Firebase registration failure:", err);
                        showAuthError(signupError, err.message);
                    });
            } else {
                // Local Storage Mock Registration Flow
                const users = JSON.parse(localStorage.getItem('techie_users')) || [];
                const userExists = users.some(u => u.email === email);

                if (userExists) {
                    showAuthError(signupError, "Email is already registered.");
                    return;
                }

                const mockUid = 'mock-user-' + Date.now();
                const newUser = { uid: mockUid, email, password, companyName, verified: false };
                users.push(newUser);
                localStorage.setItem('techie_users', JSON.stringify(users));

                // Save mock business settings profile
                const defaults = {
                    name: companyName,
                    email: email,
                    phone: '',
                    gst: '',
                    address: '',
                    logo: null
                };
                localStorage.setItem('techie_business_default_' + mockUid, JSON.stringify(defaults));

                signupForm.reset();
                showVerificationScreen(email, mockUid);
            }
        });

        // Sign In Handler
        signinForm.addEventListener('submit', (e) => {
            e.preventDefault();
            signinError.style.display = 'none';

            const email = signinEmailInput.value.trim().toLowerCase();
            const password = signinPasswordInput.value;

            if (isFirebaseConfigured) {
                // Firebase Login Flow
                firebase.auth().signInWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        const user = userCredential.user;
                        if (user.emailVerified) {
                            loginUserSession(user.email, user.uid);
                        } else {
                            showVerificationScreen(user.email, user.uid);
                        }
                    })
                    .catch((err) => {
                        console.error("Firebase login failure:", err);
                        showAuthError(signinError, "Invalid login credentials.");
                    });
            } else {
                // Local Storage Mock Login Flow
                const users = JSON.parse(localStorage.getItem('techie_users')) || [];
                const matchedUser = users.find(u => u.email === email && u.password === password);

                if (!matchedUser) {
                    showAuthError(signinError, "Invalid email or password.");
                    return;
                }

                if (matchedUser.verified) {
                    loginUserSession(matchedUser.email, matchedUser.uid);
                } else {
                    showVerificationScreen(matchedUser.email, matchedUser.uid);
                }
            }
        });

        // Google Authentication Trigger
        googleAuthBtn.addEventListener('click', () => {
            if (isFirebaseConfigured) {
                const provider = new firebase.auth.GoogleAuthProvider();
                firebase.auth().signInWithPopup(provider)
                    .then((result) => {
                        const user = result.user;
                        
                        // Validate Gmail domain (to reject Workspace custom domain emails)
                        if (!user.email.endsWith('@gmail.com')) {
                            firebase.auth().signOut();
                            showToast("Google account must end with @gmail.com", "error");
                            return;
                        }

                        // Create profile defaults on first login
                        db.collection('users').doc(user.uid).get().then(doc => {
                            if (!doc.exists || !doc.data().defaults) {
                                const defaults = {
                                    name: user.displayName || 'My Company',
                                    email: user.email,
                                    phone: '',
                                    gst: '',
                                    address: '',
                                    logo: null
                                };
                                db.collection('users').doc(user.uid).set({ defaults: defaults }, { merge: true });
                            }
                        });
                    })
                    .catch((err) => {
                        console.error("Google authentication popup failure:", err);
                        showToast("Google sign-in cancelled or failed.", "error");
                    });
            } else {
                // Sandbox Mock Simulation login for Google User
                const mockEmail = "sandbox.google@gmail.com";
                const mockUid = "mock-google-user-999";
                
                const defaults = {
                    name: "Google Sandbox Enterprise",
                    email: mockEmail,
                    phone: '',
                    gst: '',
                    address: '',
                    logo: null
                };
                localStorage.setItem('techie_business_default_' + mockUid, JSON.stringify(defaults));
                
                loginUserSession(mockEmail, mockUid);
                showToast("Sandbox: Google sign-in simulated!", "success");
            }
        });

        // Sign Out Event
        signoutBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to sign out?")) {
                triggerSignOut();
            }
        });

        // ----------------------------------------------------
        // EMAIL VERIFICATION PANEL ACTIONS
        // ----------------------------------------------------
        
        // 1. I Have Verified
        verifyRefreshBtn.addEventListener('click', () => {
            verifyError.style.display = 'none';
            verifySuccess.style.display = 'none';

            if (isFirebaseConfigured) {
                const currentUser = firebase.auth().currentUser;
                if (currentUser) {
                    currentUser.reload()
                        .then(() => {
                            if (currentUser.emailVerified) {
                                loginUserSession(currentUser.email, currentUser.uid);
                            } else {
                                showAuthError(verifyError, "Gmail account not verified yet. Please check your inbox / spam folder and click the link.");
                            }
                        })
                        .catch(err => {
                            console.error("Firebase reload error:", err);
                            showAuthError(verifyError, "Failed to refresh user status. Try again.");
                        });
                } else {
                    triggerSignOut();
                }
            } else {
                const users = JSON.parse(localStorage.getItem('techie_users')) || [];
                const matchedIdx = users.findIndex(u => u.uid === activeUserUid);

                if (matchedIdx !== -1) {
                    users[matchedIdx].verified = true;
                    localStorage.setItem('techie_users', JSON.stringify(users));
                }

                loginUserSession(activeUserEmail, activeUserUid);
            }
        });

        // 2. Resend Verification Email
        verifyResendBtn.addEventListener('click', () => {
            verifyError.style.display = 'none';
            verifySuccess.style.display = 'none';

            if (isFirebaseConfigured) {
                const currentUser = firebase.auth().currentUser;
                if (currentUser) {
                    currentUser.sendEmailVerification()
                        .then(() => {
                            verifySuccess.style.display = 'block';
                            showToast("Verification link resent to Gmail", "success");
                        })
                        .catch(err => {
                            console.error("Resend error:", err);
                            showAuthError(verifyError, "Failed to dispatch verification email. " + err.message);
                        });
                }
            } else {
                verifySuccess.style.display = 'block';
                showToast("Sandbox: Simulated verification email sent!", "success");
            }
        });

        // 3. Cancel / Sign out
        verifySignoutBtn.addEventListener('click', () => {
            triggerSignOut();
        });
    }

    function triggerSignOut() {
        if (isFirebaseConfigured) {
            firebase.auth().signOut()
                .then(() => {
                    logoutUserSession();
                    resetAuthFormsUI();
                    showToast("Signed out successfully", "info");
                })
                .catch(err => console.error("Sign out failure:", err));
        } else {
            logoutUserSession();
            resetAuthFormsUI();
            showToast("Signed out successfully", "info");
        }
    }

    function resetAuthFormsUI() {
        tabSigninBtn.classList.add('active');
        tabSignupBtn.classList.remove('active');
        signinForm.style.display = 'flex';
        signupForm.style.display = 'none';
        verificationCard.style.display = 'none';
        authTabsBar.style.display = 'grid';
        googleAuthBtn.style.display = 'flex';
        authDivider.style.display = 'flex';
        authDesc.innerText = "Register or log in to manage your billing and invoices";
        signinError.style.display = 'none';
        signupError.style.display = 'none';
        verifyError.style.display = 'none';
        verifySuccess.style.display = 'none';
    }

    function showAuthError(element, message) {
        element.innerText = message;
        element.style.display = 'block';
    }

    // ----------------------------------------------------
    // REAL-TIME PREVIEW BINDINGS
    // ----------------------------------------------------
    let syncBound = false;
    function bindRealTimeSync() {
        if (syncBound) return;
        syncBound = true;

        const syncMap = [
            { input: bizNameInput, target: 'p-biz-name' },
            { input: bizEmailInput, target: 'p-biz-email' },
            { input: bizPhoneInput, target: 'p-biz-phone' },
            { input: bizAddressInput, target: 'p-biz-address' },
            { input: bizGstInput, target: 'p-biz-gst', wrapper: 'p-biz-gst-wrapper' },
            { input: clientCompanyInput, target: 'p-client-company' },
            { input: clientNameInput, target: 'p-client-name' },
            { input: clientEmailInput, target: 'p-client-email' },
            { input: clientPhoneInput, target: 'p-client-phone' },
            { input: clientAddressInput, target: 'p-client-address' },
            { input: clientGstInput, target: 'p-client-gst', wrapper: 'p-client-gst-wrapper' },
            { input: invoiceNumInput, target: 'p-invoice-num' },
            { input: invoiceDateInput, target: 'p-invoice-date' },
            { input: dueDateInput, target: 'p-due-date' },
            { input: bankDetailsInput, target: 'p-bank-details', wrapper: 'p-bank-details-wrapper' },
            { input: invoiceNotesInput, target: 'p-invoice-notes', wrapper: 'p-invoice-notes-wrapper' }
        ];

        syncMap.forEach(item => {
            const inputEl = item.input;
            const targetEl = document.getElementById(item.target);
            const wrapperEl = item.wrapper ? document.getElementById(item.wrapper) : null;

            const syncHandler = () => {
                if (!activeUserEmail) return;
                const val = inputEl.value;
                if (targetEl) {
                    targetEl.innerText = val;
                }

                if (wrapperEl) {
                    if (val.trim() === '') {
                        wrapperEl.style.display = 'none';
                    } else {
                        wrapperEl.style.display = 'block';
                    }
                }
                calculateInvoice();
            };

            inputEl.addEventListener('input', syncHandler);
            inputEl.addEventListener('change', syncHandler);
            
            syncHandler();
        });

        currencySelect.addEventListener('change', calculateInvoice);
    }

    // ----------------------------------------------------
    // SERVICES ITEMIZED ROWS BINDINGS
    // ----------------------------------------------------
    function addItemRow(desc = '', qty = 1, price = 0, tax = 0) {
        if (!activeUserEmail) return;

        const rowId = 'row-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        const rowDiv = document.createElement('div');
        rowDiv.className = 'item-row';
        rowDiv.id = rowId;

        rowDiv.innerHTML = `
            <button class="item-delete-btn" type="button" title="Delete Item">&times;</button>
            <div class="item-row-grid">
                <div class="form-group col-12">
                    <label>Description*</label>
                    <input class="item-desc-input" type="text" placeholder="e.g. Software Development" value="${desc}">
                </div>
                <div class="form-group col-4">
                    <label>Qty*</label>
                    <input class="item-qty-input" type="number" min="0.01" step="any" value="${qty}">
                </div>
                <div class="form-group col-4">
                    <label>Rate*</label>
                    <input class="item-price-input" type="number" min="0" step="any" value="${price}">
                </div>
                <div class="form-group col-4">
                    <label>Tax %</label>
                    <input class="item-tax-input" type="number" min="0" max="100" step="any" value="${tax}">
                </div>
            </div>
        `;

        itemsContainer.appendChild(rowDiv);

        rowDiv.querySelector('.item-delete-btn').addEventListener('click', () => {
            rowDiv.remove();
            calculateInvoice();
            showToast("Line item removed", "info");
        });

        const inputs = rowDiv.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', calculateInvoice);
        });

        calculateInvoice();
    }

    addItemBtn.addEventListener('click', () => {
        addItemRow();
    });

    // ----------------------------------------------------
    // INVOICE MATH CALCULATIONS
    // ----------------------------------------------------
    function calculateInvoice() {
        if (!activeUserEmail) return;

        const currency = currencySelect.value;
        const currencySymbol = CURRENCY_SYMBOLS[currency] || '$';

        const rows = itemsContainer.querySelectorAll('.item-row');
        const previewItemsBody = document.getElementById('preview-items-body');
        previewItemsBody.innerHTML = '';

        let subtotal = 0;
        let taxTotal = 0;

        rows.forEach(row => {
            const desc = row.querySelector('.item-desc-input').value || 'New Line Item';
            const qty = parseFloat(row.querySelector('.item-qty-input').value) || 0;
            const price = parseFloat(row.querySelector('.item-price-input').value) || 0;
            const taxRate = parseFloat(row.querySelector('.item-tax-input').value) || 0;

            const rowAmount = qty * price;
            const rowTax = rowAmount * (taxRate / 100);

            subtotal += rowAmount;
            taxTotal += rowTax;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <span class="item-desc-text">${escapeHtml(desc)}</span>
                </td>
                <td class="text-right">${qty.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}</td>
                <td class="text-right">${formatCurrency(price, currencySymbol)}</td>
                <td class="text-right">${taxRate}%</td>
                <td class="text-right">${formatCurrency(rowAmount, currencySymbol)}</td>
            `;
            previewItemsBody.appendChild(tr);
        });

        if (rows.length === 0) {
            const emptyTr = document.createElement('tr');
            emptyTr.innerHTML = `<td colspan="5" style="padding: 24px; color: var(--gray-medium); text-align: center; font-style: italic;">No items added yet. Click "Add Line Item" to start.</td>`;
            previewItemsBody.appendChild(emptyTr);
        }

        const grandTotal = subtotal + taxTotal;

        document.getElementById('p-subtotal').innerText = formatCurrency(subtotal, currencySymbol);
        document.getElementById('p-tax-total').innerText = formatCurrency(taxTotal, currencySymbol);
        document.getElementById('p-grand-total').innerText = formatCurrency(grandTotal, currencySymbol);
    }

    function formatCurrency(amount, symbol) {
        return symbol + ' ' + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ----------------------------------------------------
    // BUSINESS LOGO UPLOADS
    // ----------------------------------------------------
    bizLogoInput.addEventListener('change', (e) => {
        handleLogoFile(e.target.files[0]);
    });

    logoDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        logoDropzone.style.borderColor = 'var(--primary)';
        logoDropzone.style.backgroundColor = 'var(--primary-light)';
    });

    logoDropzone.addEventListener('dragleave', () => {
        logoDropzone.style.borderColor = 'var(--gray-light)';
        logoDropzone.style.backgroundColor = 'var(--bg-app)';
    });

    logoDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        logoDropzone.style.borderColor = 'var(--gray-light)';
        logoDropzone.style.backgroundColor = 'var(--bg-app)';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleLogoFile(e.dataTransfer.files[0]);
        }
    });

    function handleLogoFile(file) {
        if (!file || !activeUserEmail) return;

        if (!file.type.startsWith('image/')) {
            showToast("Only image files are allowed", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            invoiceLogoBase64 = e.target.result;
            
            logoPreviewImg.src = invoiceLogoBase64;
            logoPreviewImg.style.display = 'block';
            logoDropzone.querySelector('.dropzone-text').style.display = 'none';
            removeLogoBtn.style.display = 'inline-block';
            previewLogoContainer.innerHTML = `<img src="${invoiceLogoBase64}" alt="Business Logo">`;
            showToast("Logo uploaded successfully", "success");
        };
        reader.readAsDataURL(file);
    }

    removeLogoBtn.addEventListener('click', () => {
        invoiceLogoBase64 = null;
        logoPreviewImg.src = '';
        logoPreviewImg.style.display = 'none';
        logoDropzone.querySelector('.dropzone-text').style.display = 'block';
        removeLogoBtn.style.display = 'none';
        bizLogoInput.value = '';

        previewLogoContainer.innerHTML = `
            <div class="default-logo-placeholder">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                    <polyline points="2 17 12 22 22 17"></polyline>
                    <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
            </div>
        `;
        if (activeUserEmail) showToast("Logo removed", "info");
    });

    // ----------------------------------------------------
    // DEFAULT PROFILE STORAGE
    // ----------------------------------------------------
    saveDefaultsBtn.addEventListener('click', () => {
        if (!activeUserEmail || !activeUserUid) return;

        const defaults = {
            name: bizNameInput.value,
            email: bizEmailInput.value,
            phone: bizPhoneInput.value,
            gst: bizGstInput.value,
            address: bizAddressInput.value,
            logo: invoiceLogoBase64
        };

        if (isFirebaseConfigured) {
            db.collection('users').doc(activeUserUid).set({ defaults: defaults }, { merge: true })
                .then(() => {
                    showToast("Business profile defaults saved to cloud!", "success");
                })
                .catch(err => {
                    console.error("Firestore defaults save failure:", err);
                    showToast("Failed to save profile details to Firebase", "error");
                });
        } else {
            localStorage.setItem('techie_business_default_' + activeUserUid, JSON.stringify(defaults));
            showToast("Business details saved locally!", "success");
        }
    });

    function loadBusinessDefaults() {
        if (!activeUserEmail || !activeUserUid) return;

        if (isFirebaseConfigured) {
            db.collection('users').doc(activeUserUid).get()
                .then(doc => {
                    if (doc.exists && doc.data().defaults) {
                        applyDefaultsData(doc.data().defaults);
                    } else {
                        applyEmptyDefaults();
                    }
                })
                .catch(err => {
                    console.error("Firestore defaults load failure:", err);
                    applyEmptyDefaults();
                });
        } else {
            const cached = localStorage.getItem('techie_business_default_' + activeUserUid);
            if (cached) {
                try {
                    applyDefaultsData(JSON.parse(cached));
                } catch (err) {
                    console.error("Local load defaults failure:", err);
                    applyEmptyDefaults();
                }
            } else {
                applyEmptyDefaults();
            }
        }
    }

    function applyDefaultsData(data) {
        bizNameInput.value = data.name || '';
        bizEmailInput.value = data.email || '';
        bizPhoneInput.value = data.phone || '';
        bizGstInput.value = data.gst || '';
        bizAddressInput.value = data.address || '';
        
        if (data.logo) {
            invoiceLogoBase64 = data.logo;
            logoPreviewImg.src = invoiceLogoBase64;
            logoPreviewImg.style.display = 'block';
            logoDropzone.querySelector('.dropzone-text').style.display = 'none';
            removeLogoBtn.style.display = 'inline-block';
            previewLogoContainer.innerHTML = `<img src="${invoiceLogoBase64}" alt="Business Logo">`;
        } else {
            removeLogoBtn.click();
        }

        const event = new Event('change');
        bizNameInput.dispatchEvent(event);
    }

    function applyEmptyDefaults() {
        bizNameInput.value = '';
        bizEmailInput.value = activeUserEmail;
        bizPhoneInput.value = '';
        bizGstInput.value = '';
        bizAddressInput.value = '';
        removeLogoBtn.click();

        const event = new Event('change');
        bizNameInput.dispatchEvent(event);
    }

    // ----------------------------------------------------
    // INVOICES CRUD OPERATIONS (FIRESTORE OR LOCAL STORAGE)
    // ----------------------------------------------------
    function loadSavedInvoices() {
        if (!activeUserEmail || !activeUserUid) return;

        if (isFirebaseConfigured) {
            db.collection('users').doc(activeUserUid).collection('invoices').get()
                .then(querySnapshot => {
                    savedInvoices = [];
                    querySnapshot.forEach(doc => {
                        savedInvoices.push(doc.data());
                    });
                    renderSavedInvoicesList();
                    
                    if (itemsContainer.children.length === 0) {
                        initDefaultItems();
                    }
                })
                .catch(err => {
                    console.error("Firestore loading invoices failure:", err);
                    savedInvoices = [];
                    renderSavedInvoicesList();
                });
        } else {
            savedInvoices = JSON.parse(localStorage.getItem('techie_invoices_' + activeUserUid)) || [];
            renderSavedInvoicesList();
            
            if (itemsContainer.children.length === 0) {
                initDefaultItems();
            }
        }
    }

    saveInvoiceBtn.addEventListener('click', () => {
        if (!activeUserEmail || !activeUserUid) return;

        const invNum = invoiceNumInput.value.trim();
        const clientComp = clientCompanyInput.value.trim();

        if (!invNum) {
            showToast("Please enter an Invoice Number", "error");
            invoiceNumInput.focus();
            return;
        }

        if (!clientComp) {
            showToast("Please enter a Client Company name", "error");
            clientCompanyInput.focus();
            return;
        }

        const items = [];
        const rows = itemsContainer.querySelectorAll('.item-row');
        rows.forEach(row => {
            items.push({
                description: row.querySelector('.item-desc-input').value,
                quantity: parseFloat(row.querySelector('.item-qty-input').value) || 0,
                price: parseFloat(row.querySelector('.item-price-input').value) || 0,
                tax: parseFloat(row.querySelector('.item-tax-input').value) || 0
            });
        });

        let subtotal = 0;
        let taxTotal = 0;
        items.forEach(it => {
            const amount = it.quantity * it.price;
            subtotal += amount;
            taxTotal += amount * (it.tax / 100);
        });
        const totalVal = subtotal + taxTotal;

        const invoiceData = {
            id: 'inv-' + Date.now(),
            logo: invoiceLogoBase64,
            bizName: bizNameInput.value,
            bizEmail: bizEmailInput.value,
            bizPhone: bizPhoneInput.value,
            bizGst: bizGstInput.value,
            bizAddress: bizAddressInput.value,
            clientCompany: clientCompanyInput.value,
            clientName: clientNameInput.value,
            clientEmail: clientEmailInput.value,
            clientPhone: clientPhoneInput.value,
            clientGst: clientGstInput.value,
            clientAddress: clientAddressInput.value,
            invoiceNumber: invNum,
            currency: currencySelect.value,
            invoiceDate: invoiceDateInput.value,
            dueDate: dueDateInput.value,
            items: items,
            bankDetails: bankDetailsInput.value,
            notes: invoiceNotesInput.value,
            total: totalVal,
            timestamp: new Date().toLocaleDateString()
        };

        if (isFirebaseConfigured) {
            db.collection('users').doc(activeUserUid).collection('invoices').doc(invNum).set(invoiceData)
                .then(() => {
                    showToast(`Invoice ${invNum} saved to cloud!`, "success");
                    loadSavedInvoices();
                })
                .catch(err => {
                    console.error("Firestore save error:", err);
                    showToast("Failed to save to cloud", "error");
                });
        } else {
            const existingIdx = savedInvoices.findIndex(inv => inv.invoiceNumber === invNum);
            if (existingIdx !== -1) {
                savedInvoices[existingIdx] = invoiceData;
                showToast(`Invoice ${invNum} updated!`, "success");
            } else {
                savedInvoices.push(invoiceData);
                showToast(`Invoice ${invNum} saved!`, "success");
            }

            localStorage.setItem('techie_invoices_' + activeUserUid, JSON.stringify(savedInvoices));
            renderSavedInvoicesList();
        }
    });

    function renderSavedInvoicesList() {
        savedInvoicesList.innerHTML = '';

        if (savedInvoices.length === 0) {
            savedInvoicesList.innerHTML = '<div class="empty-state">No saved invoices found.</div>';
            return;
        }

        const sorted = [...savedInvoices].sort((a, b) => b.id.localeCompare(a.id));

        sorted.forEach(inv => {
            const card = document.createElement('div');
            card.className = 'saved-card';

            const currencySymbol = CURRENCY_SYMBOLS[inv.currency] || '$';
            const displayTotal = formatCurrency(inv.total, currencySymbol);

            card.innerHTML = `
                <div class="saved-info">
                    <span class="saved-num">${escapeHtml(inv.invoiceNumber)}</span>
                    <span class="saved-meta">${escapeHtml(inv.clientCompany)} • ${inv.timestamp}</span>
                </div>
                <div class="saved-total">${displayTotal}</div>
                <button class="delete-saved-btn" title="Delete Invoice">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            `;

            card.querySelector('.saved-info').addEventListener('click', () => {
                loadInvoiceData(inv);
            });

            card.querySelector('.delete-saved-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete invoice ${inv.invoiceNumber}?`)) {
                    deleteInvoice(inv.invoiceNumber, inv.id);
                }
            });

            savedInvoicesList.appendChild(card);
        });
    }

    function deleteInvoice(invoiceNumber, id) {
        if (!activeUserEmail || !activeUserUid) return;

        if (isFirebaseConfigured) {
            db.collection('users').doc(activeUserUid).collection('invoices').doc(invoiceNumber).delete()
                .then(() => {
                    showToast("Invoice deleted from cloud", "info");
                    loadSavedInvoices();
                })
                .catch(err => {
                    console.error("Firestore delete failure:", err);
                    showToast("Failed to delete from cloud", "error");
                });
        } else {
            savedInvoices = savedInvoices.filter(inv => inv.id !== id);
            localStorage.setItem('techie_invoices_' + activeUserUid, JSON.stringify(savedInvoices));
            renderSavedInvoicesList();
            showToast("Invoice deleted", "info");
        }
    }

    // ----------------------------------------------------
    // INVOICE RESET TRIGGER
    // ----------------------------------------------------
    resetInvoiceBtn.addEventListener('click', () => {
        if (!activeUserEmail) return;

        if (confirm("Reset current invoice form? Your business default profile details will be retained.")) {
            clientCompanyInput.value = '';
            clientNameInput.value = '';
            clientEmailInput.value = '';
            clientPhoneInput.value = '';
            clientGstInput.value = '';
            clientAddressInput.value = '';

            invoiceNumInput.value = 'INV-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            currencySelect.value = 'USD';
            invoiceDateInput.value = today;
            dueDateInput.value = fifteenDaysLater;

            initDefaultItems();
            bankDetailsInput.value = '';
            invoiceNotesInput.value = '';

            loadBusinessDefaults();

            const event = new Event('change');
            bizNameInput.dispatchEvent(event);
            clientCompanyInput.dispatchEvent(event);

            calculateInvoice();
            showToast("Form cleared", "info");
        }
    });

    // ----------------------------------------------------
    // INVOICE PRINT TRIGGER
    // ----------------------------------------------------
    printInvoiceBtn.addEventListener('click', () => {
        if (!activeUserEmail) return;

        if (!bizNameInput.value.trim()) {
            showToast("Please fill in your Business Name before printing", "error");
            bizNameInput.focus();
            return;
        }
        if (!clientCompanyInput.value.trim()) {
            showToast("Please fill in Client Company name before printing", "error");
            clientCompanyInput.focus();
            return;
        }

        window.print();
    });

    // ----------------------------------------------------
    // UTILITY: DYNAMIC TOAST NOTIFICATIONS
    // ----------------------------------------------------
    function showToast(message, type = "success") {
        toast.innerText = message;
        toast.className = "toast"; 
        
        if (type === "error") {
            toast.classList.add("error-toast");
        } else if (type === "info") {
            toast.style.borderLeftColor = "var(--gray-medium)";
        } else {
            toast.style.borderLeftColor = "var(--success)";
        }

        toast.classList.add("show");

        setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }
});
