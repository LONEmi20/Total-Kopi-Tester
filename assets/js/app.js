const CONFIG = {
            whatsappNumber: "6285789268613", 
            gojekLink: "https://gofood.co.id/",
            grabLink: "https://food.grab.com/",
            instagramLink: "https://instagram.com/totalkopi",
            email: "halo@totalkopi.com",
            address: "Jl. Raya Bogor No.62, Ruko No.4, RT.01/RW.01, Cibuluh, Kec. Bogor Utara, Kota Bogor, Jawa Barat 16151.",
            hours: "Senin - Minggu: 07:00 - 21:00 WIB"
        };

        let cart = JSON.parse(localStorage.getItem('totalKopiCart')) || [];
        let currentModalProduct = null;
        let currentModalQty = 1;
        let products = []; 
        document.addEventListener('DOMContentLoaded', async () => {
            initContactInfo();
            handleRouting();
            
            try {
                const response = await fetch('http://192.168.1.141:5000/api/products');
                products = await response.json(); 
                renderMenu();
                loadTestimonials();
                renderCart();
                setupSearch();
            } catch (error) {
                console.error("Gagal terhubung ke database:", error);
                showToast("Maaf, gagal memuat menu kopi.");
            }
        });

        function handleRouting() {
            let hash = window.location.hash || '#home';
            let targetPageId = 'page-' + hash.substring(1);
            
            document.querySelectorAll('.page-section').forEach(page => {
                page.classList.remove('active');
            });
            
            document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
                link.classList.remove('text-accent-gold', 'font-bold');
            });

            const targetPage = document.getElementById(targetPageId);
            if (targetPage) {
                targetPage.classList.add('active');
            } else {
                document.getElementById('page-home').classList.add('active');
                hash = '#home';
            }

            document.querySelectorAll(`a[href="${hash}"]`).forEach(link => {
                if(link.classList.contains('nav-link') || link.classList.contains('mobile-nav-link')) {
                    link.classList.add('text-accent-gold', 'font-bold');
                }
            });

            window.scrollTo(0, 0);

            document.getElementById('mobile-menu').classList.add('hidden');

            setTimeout(initScrollReveal, 50); 
        }

        window.addEventListener('hashchange', handleRouting);

        function renderMenu() {
            const container = document.getElementById('shop-menu-container');
            if (!container) return;
            container.innerHTML = ''; 

            const categories = ['Coffee', 'Non Coffee', 'Japanese Coffee'];
            const icons = {'Coffee': '😃', 'Non Coffee': '😃', 'Japanese Coffee': '😃'};

            categories.forEach((cat, index) => {
                const categoryProducts = products.filter(p => p.category === cat);
                if (categoryProducts.length > 0) {
                    const catSection = document.createElement('div');
                    catSection.className = 'mb-12';
                    catSection.innerHTML = `
                        <div class="flex items-center gap-4 mb-8 reveal">
                            <span class="text-3xl">${icons[cat]}</span>
                            <h3 class="text-3xl font-serif font-bold text-coffee-espresso uppercase tracking-wider">${cat}</h3>
                            <div class="h-px bg-coffee-latte/50 flex-grow"></div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            ${categoryProducts.map(p => `
                                <div class="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group border border-gray-100 reveal cursor-pointer flex flex-col transform hover:-translate-y-2" onclick="openProductModal(${p.id})">
                                    <div class="relative h-64 overflow-hidden">
                                        <img src="${p.img}" alt="${p.name}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                                        <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-coffee-mocha rounded-full uppercase tracking-wider shadow-sm">
                                            ${p.category}
                                        </div>
                                    </div>
                                    <div class="p-6 flex flex-col flex-grow">
                                        <div class="flex justify-between items-start mb-2">
                                            <h4 class="text-xl font-bold text-coffee-dark group-hover:text-coffee-mocha transition-colors">${p.name}</h4>
                                        </div>
                                        <div class="text-lg font-bold text-coffee-espresso mb-3">Rp ${p.price.toLocaleString('id-ID')}</div>
                                        <p class="text-gray-500 text-sm mb-6 flex-grow line-clamp-2">${p.desc}</p>
                                        
                                        <div class="w-full h-px bg-gray-100 mb-4"></div>
                                        
                                        <button onclick="event.stopPropagation(); addToCart(${p.id}, 1)" class="w-full bg-coffee-beige text-coffee-dark hover:bg-coffee-dark hover:text-white border border-coffee-latte py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-md">
                                            <i class="fas fa-cart-plus"></i> Tambah
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                    container.appendChild(catSection);
                }
            });
        }

        function saveCart() {
            localStorage.setItem('totalKopiCart', JSON.stringify(cart));
            renderCart();
        }

        function toggleCart() {
            const sidebar = document.getElementById('cart-sidebar');
            const overlay = document.getElementById('cart-overlay');
            
            if (sidebar.classList.contains('translate-x-full')) {
                sidebar.classList.remove('translate-x-full');
                overlay.classList.remove('hidden');
                setTimeout(() => overlay.classList.remove('opacity-0'), 10);
                document.body.style.overflow = 'hidden'; 
            } else {
                sidebar.classList.add('translate-x-full');
                overlay.classList.add('opacity-0');
                setTimeout(() => overlay.classList.add('hidden'), 300);
                document.body.style.overflow = '';
            }
        }

        function addToCart(productId, qty = 1) {
            const product = products.find(p => p.id === productId);
            if (!product) return;

            const existingItem = cart.find(item => item.id === product.id);
            if (existingItem) {
                existingItem.qty += qty;
            } else {
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    img: product.img,
                    qty: qty
                });
            }
            
            saveCart();
            showToast(`✓ Berhasil menambahkan ${qty} ${product.name} ke keranjang`);
        }

        function updateCartQty(id, change) {
            const item = cart.find(i => i.id === id);
            if (item) {
                item.qty += change;
                if (item.qty <= 0) {
                    cart = cart.filter(i => i.id !== id); 
                }
                saveCart();
            }
        }

        function renderCart() {
            const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
            const badgeDesktop = document.getElementById('cart-badge-desktop');
            const badgeMobile = document.getElementById('cart-badge-mobile');
            
            [badgeDesktop, badgeMobile].forEach(badge => {
                if(badge) {
                    badge.innerText = totalItems;
                    if(totalItems > 0) badge.classList.remove('hidden');
                    else badge.classList.add('hidden');
                }
            });

            const container = document.getElementById('cart-items');
            const emptyMsg = document.getElementById('empty-cart-msg');
            const checkoutBtn = document.getElementById('checkout-btn');
            const totalPriceEl = document.getElementById('cart-total-price');

            if (!container) return;
            
            Array.from(container.children).forEach(child => {
                if (child.id !== 'empty-cart-msg') child.remove();
            });

            let totalPrice = 0;

            if (cart.length === 0) {
                emptyMsg.classList.remove('hidden');
                emptyMsg.classList.add('flex');
                checkoutBtn.disabled = true;
                totalPriceEl.innerText = 'Rp 0';
            } else {
                emptyMsg.classList.add('hidden');
                emptyMsg.classList.remove('flex');
                checkoutBtn.disabled = false;
                
                cart.forEach(item => {
                    const itemTotal = item.price * item.qty;
                    totalPrice += itemTotal;
                    
                    const div = document.createElement('div');
                    div.className = 'flex gap-4 items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative group transition-all hover:shadow-md';
                    div.innerHTML = `
                        <img src="${item.img}" alt="${item.name}" class="w-20 h-20 object-cover rounded-xl border border-gray-100 shadow-sm">
                        <div class="flex-grow">
                            <h4 class="font-bold text-coffee-dark leading-tight">${item.name}</h4>
                            <div class="text-sm text-gray-500 mb-3">Rp ${item.price.toLocaleString('id-ID')}</div>
                            <div class="flex items-center justify-between">
                                <div class="flex items-center bg-coffee-beige rounded-lg border border-coffee-latte/30 overflow-hidden">
                                    <button onclick="updateCartQty(${item.id}, -1)" class="w-8 h-8 flex items-center justify-center text-coffee-mocha hover:bg-coffee-latte/50 transition-colors font-bold">-</button>
                                    <span class="w-8 text-center text-sm font-bold text-coffee-dark">${item.qty}</span>
                                    <button onclick="updateCartQty(${item.id}, 1)" class="w-8 h-8 flex items-center justify-center text-coffee-mocha hover:bg-coffee-latte/50 transition-colors font-bold">+</button>
                                </div>
                                <span class="font-bold text-coffee-espresso">Rp ${itemTotal.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                        <button onclick="updateCartQty(${item.id}, -999)" class="absolute -top-3 -right-3 bg-red-100 text-red-500 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white shadow-sm border border-red-200">
                            <i class="fas fa-times text-xs"></i>
                        </button>
                    `;
                    container.appendChild(div);
                });
                
                totalPriceEl.innerText = `Rp ${totalPrice.toLocaleString('id-ID')}`;
            }
        }
async function checkoutToWhatsApp() {
    if(cart.length === 0) { showToast("Keranjangmu masih kosong!"); return; }

    const custName = document.getElementById('checkout-name').value.trim();
    const custPhone = document.getElementById('checkout-phone').value.trim();
    const custAddress = document.getElementById('checkout-address').value.trim();

    if(!custName || !custPhone || !custAddress) {
        showToast("⚠️ Mohon isi Nama, No. WhatsApp, dan Alamat!");
        return;
    }

    let total = 0;
    cart.forEach(item => total += (item.price * item.qty));

    try {
        await fetch('http://192.168.1.141:5000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_name: custName,
                phone: custPhone,
                address: custAddress,
                items: cart,
                total_price: total
            })
        });
    } catch (error) {
        console.error("Gagal mencatat ke database:", error);
    }

    let text = `Halo Total Kopi 👋\nSaya ingin memesan:\n\n`;
    cart.forEach(item => {
        const subtotal = item.price * item.qty;
        text += `• ${item.name} (${item.qty}x) = Rp ${subtotal.toLocaleString('id-ID')}\n`;
    });
    
    text += `\n*Total: Rp ${total.toLocaleString('id-ID')}*\n\nData Pengiriman:\nNama: ${custName}\nNo. HP: ${custPhone}\nAlamat: ${custAddress}\n\nMohon konfirmasi pesanan saya.`;
    
    window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
    
    cart = [];
    saveCart();
    toggleCart();
}

        function openProductModal(productId) {
            const product = products.find(p => p.id === productId);
            if (!product) return;

            currentModalProduct = product;
            currentModalQty = 1;
            document.getElementById('modal-qty').innerText = 1;

            document.getElementById('modal-img').src = product.img;
            document.getElementById('modal-category').innerText = product.category;
            document.getElementById('modal-title').innerText = product.name;
            document.getElementById('modal-price').innerText = `Rp ${product.price.toLocaleString('id-ID')}`;
            document.getElementById('modal-desc').innerText = product.desc;
            
            document.getElementById('modal-add-btn').onclick = () => {
                addToCart(product.id, currentModalQty);
                closeProductModal();
            };

            const modal = document.getElementById('product-modal');
            const modalContent = modal.querySelector('div');
            
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                modalContent.classList.remove('scale-95');
                modalContent.classList.add('scale-100');
            }, 10);
            document.body.style.overflow = 'hidden';
        }

        function closeProductModal() {
            const modal = document.getElementById('product-modal');
            const modalContent = modal.querySelector('div');
            
            modal.classList.add('opacity-0');
            modalContent.classList.remove('scale-100');
            modalContent.classList.add('scale-95');
            
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }, 300);
            document.body.style.overflow = '';
        }

        function changeModalQty(change) {
            currentModalQty += change;
            if (currentModalQty < 1) currentModalQty = 1;
            document.getElementById('modal-qty').innerText = currentModalQty;
        }

        const quizQuestions = [
            {
                q: "Kamu ingin minuman dengan kopi atau tanpa kopi?",
                options: [
                    { text: "Dengan Kopi", value: "coffee" },
                    { text: "Tanpa Kopi", value: "non-coffee" }
                ]
            },
            {
                q: "Kamu lebih suka rasa kopi seperti apa?",
                options: [
                    { text: "Manis & Creamy", value: "sweet" },
                    { text: "Strong & Bold", value: "strong" },
                    { text: "Segar & Unik", value: "fresh" }
                ]
            },
            {
                q: "Kamu lebih suka rasa seperti apa?",
                options: [
                    { text: "Cokelat", value: "choco" },
                    { text: "Creamy & Matcha", value: "matcha" },
                    { text: "Segar & Fruity", value: "fruity" }
                ]
            },
            {
                q: "Kamu ingin menikmatinya seperti apa?",
                options: [
                    { text: "Dingin", value: "cold" },
                    { text: "Hangat", value: "hot" },
                    { text: "Bebas atur aja", value: "any" }
                ]
            }
        ];

        let currentQ = 0;
        let answers = [];

        function renderQuiz() {
            const qObj = quizQuestions[currentQ];
            document.getElementById('quiz-question').innerText = qObj.q;
            
            let stepNum = answers.length + 1;
            document.getElementById('quiz-progress').innerText = `Pertanyaan ${stepNum} dari 3`;

            const optionsContainer = document.getElementById('quiz-options');
            optionsContainer.innerHTML = '';
            
            qObj.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'bg-white border-2 border-coffee-cream hover:border-accent-gold text-coffee-dark font-medium py-4 px-6 rounded-2xl transition-all duration-300 hover:shadow-md';
                btn.innerText = opt.text;
                btn.onclick = () => handleAnswer(opt.value);
                optionsContainer.appendChild(btn);
            });
        }

        function handleAnswer(val) {
            answers.push(val);
            if (answers.length === 1) {
                currentQ = (val === 'coffee') ? 1 : 2;
            } else if (answers.length === 2) {
                currentQ = 3;
            } else if (answers.length === 3) {
                showResult();
                return;
            }
            renderQuiz();
        }

        function showResult() {
            document.getElementById('quiz-container').classList.add('hidden');
            document.getElementById('quiz-result').classList.remove('hidden');
            
            const [base, flavor, temp] = answers;
            let recommendedProductId = 1;
            let customDesc = "Minuman ini sangat cocok dengan preferensimu.";

            if (base === 'coffee') {
                if (flavor === 'sweet') {
                    recommendedProductId = 6;
                    customDesc = "Kamu sepertinya menyukai kopi yang manis dan creamy. Caramel Macchiato bisa menjadi pilihan yang cocok untukmu.";
                } else if (flavor === 'strong') {
                    recommendedProductId = 2;
                    if(temp === 'hot') recommendedProductId = 4;
                    customDesc = "Karakter rasa kopi yang kuat dan berani adalah pilihanmu. Cocok untuk dorongan semangat!";
                } else if (flavor === 'fresh') {
                    recommendedProductId = 11;
                    customDesc = "Kamu suka petualangan rasa! Kesegaran unik kopi ala Jepang ini akan mengejutkan lidahmu.";
                }
            } else {
                if (flavor === 'choco') {
                    recommendedProductId = 7;
                    customDesc = "Cokelat selalu bisa memperbaiki mood. Rasa pekatnya sangat pas untukmu.";
                } else if (flavor === 'matcha') {
                    recommendedProductId = 8;
                    customDesc = "Ketenangan ala Jepang ada di minuman ini. Creamy dan sangat menenangkan.";
                } else if (flavor === 'fruity') {
                    recommendedProductId = 10;
                    customDesc = "Kesegaran buah asli adalah yang kamu butuhkan sekarang. Sangat fresh!";
                }
            }

            const recProduct = products.find(p => p.id === recommendedProductId);
            
            document.getElementById('result-id').value = recProduct.id;
            document.getElementById('result-name').innerText = recProduct.name;
            document.getElementById('result-desc').innerText = customDesc;
            document.getElementById('result-img').src = recProduct.img;
            document.getElementById('result-price').innerText = recProduct.price.toLocaleString('id-ID');
            
            document.getElementById('btn-result-add').onclick = () => {
                addToCart(recProduct.id, 1);
            };
        }

        function resetQuiz() {
            currentQ = 0;
            answers = [];
            document.getElementById('quiz-container').classList.remove('hidden');
            document.getElementById('quiz-result').classList.add('hidden');
            renderQuiz();
        }

        renderQuiz();

        function setupSearch() {
            const searchInput = document.getElementById('searchInput');
            const searchResults = document.getElementById('searchResults');
            
            if(!searchInput) return;

            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                searchResults.innerHTML = '';
                
                if (query.length === 0) {
                    searchResults.classList.add('hidden');
                    return;
                }

                const matches = products.filter(p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query));

                if (matches.length > 0) {
                    searchResults.classList.remove('hidden');
                    matches.forEach(p => {
                        const div = document.createElement('div');
                        div.className = 'p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-100 last:border-0';
                        div.innerHTML = `
                            <img src="${p.img}" class="w-10 h-10 rounded object-cover">
                            <div>
                                <div class="font-bold text-sm text-coffee-dark">${p.name}</div>
                                <div class="text-xs text-gray-500">Rp ${p.price.toLocaleString('id-ID')}</div>
                            </div>
                        `;
                        div.onclick = () => {
                            openProductModal(p.id);
                            searchResults.classList.add('hidden');
                            searchInput.value = '';
                        };
                        searchResults.appendChild(div);
                    });
                } else {
                    searchResults.classList.remove('hidden');
                    searchResults.innerHTML = '<div class="p-4 text-center text-sm text-gray-500">Tidak ada yang cocok</div>';
                }
            });

            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                    searchResults.classList.add('hidden');
                }
            });
        }

        function showToast(message) {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            
            toast.className = 'bg-coffee-dark text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transform translate-y-10 opacity-0 transition-all duration-300 border border-coffee-espresso';
            toast.innerHTML = `<span class="font-medium">${message}</span>`;
            
            container.appendChild(toast);
            
            setTimeout(() => { toast.classList.remove('translate-y-10', 'opacity-0'); }, 10);
            setTimeout(() => {
                toast.classList.add('opacity-0', 'translate-y-10');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        function openLightbox(element) {
            const imgSrc = element.querySelector('img').src;
            const lightbox = document.getElementById('lightbox');
            const lightboxImg = document.getElementById('lightbox-img');
            
            lightboxImg.src = imgSrc;
            lightbox.classList.remove('hidden');
            lightbox.classList.add('flex');
            
            setTimeout(() => {
                lightbox.classList.remove('opacity-0');
                lightboxImg.classList.remove('scale-95');
                lightboxImg.classList.add('scale-100');
            }, 10);
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            const lightbox = document.getElementById('lightbox');
            const lightboxImg = document.getElementById('lightbox-img');
            
            lightbox.classList.add('opacity-0');
            lightboxImg.classList.remove('scale-100');
            lightboxImg.classList.add('scale-95');
            
            setTimeout(() => {
                lightbox.classList.add('hidden');
                lightbox.classList.remove('flex');
            }, 300);
            document.body.style.overflow = '';
        }

        function initContactInfo() {
            if(document.getElementById('link-wa-card')) document.getElementById('link-wa-card').href = `https://wa.me/${CONFIG.whatsappNumber}`;
            if(document.getElementById('link-gojek-card')) document.getElementById('link-gojek-card').href = CONFIG.gojekLink;
            if(document.getElementById('link-grab-card')) document.getElementById('link-grab-card').href = CONFIG.grabLink;
            
            if(document.getElementById('info-address')) document.getElementById('info-address').innerText = CONFIG.address;
            if(document.getElementById('info-hours')) document.getElementById('info-hours').innerText = CONFIG.hours;
            if(document.getElementById('info-email')) document.getElementById('info-email').innerText = CONFIG.email;
            
            if(document.getElementById('footer-ig')) document.getElementById('footer-ig').href = CONFIG.instagramLink;
            if(document.getElementById('footer-wa')) document.getElementById('footer-wa').href = `https://wa.me/${CONFIG.whatsappNumber}`;
            if(document.getElementById('footer-gojek')) document.getElementById('footer-gojek').href = CONFIG.gojekLink;
            if(document.getElementById('footer-grab')) document.getElementById('footer-grab').href = CONFIG.grabLink;
        }

        function initScrollReveal() {
            function checkScroll() {
                const windowHeight = window.innerHeight;
                const elementVisible = 100;
                
                const reveals = document.querySelectorAll('.page-section.active .reveal');

                reveals.forEach(reveal => {
                    const elementTop = reveal.getBoundingClientRect().top;
                    if (elementTop < windowHeight - elementVisible) {
                        reveal.classList.add('active');
                    }
                });

                const navbar = document.getElementById('navbar');
                if (window.scrollY > 50) {
                    navbar.classList.add('py-2', 'shadow-md');
                    navbar.classList.remove('py-4');
                } else {
                    navbar.classList.add('py-4');
                    navbar.classList.remove('py-2', 'shadow-md');
                }
            }

            window.addEventListener('scroll', checkScroll);
            checkScroll(); 
        }

        const btn = document.getElementById('mobile-menu-btn');
        const menu = document.getElementById('mobile-menu');

        btn.addEventListener('click', () => {
            menu.classList.toggle('hidden');

        });

                async function loadTestimonials() {
    try {
        const response = await fetch('http://192.168.1.141:5000/api/testimonials');
        const testis = await response.json();
        const grid = document.getElementById('testimonial-grid');
        
        grid.innerHTML = '';
        
        testis.forEach(t => {
            let stars = '⭐'.repeat(t.rating);
            grid.innerHTML += `
                <div class="bg-white rounded-2xl p-8 border border-coffee-cream shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-1">
                    <div class="text-xl mb-4">${stars}</div>
                    <p class="text-gray-600 italic mb-6 line-clamp-4">"${t.comment}"</p>
                    <div class="font-bold text-coffee-espresso">— ${t.name}</div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Gagal memuat testimoni:", error);
    }
}

        document.getElementById('form-testimoni').addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const name = document.getElementById('testi-nama').value;
    const rating = parseInt(document.getElementById('testi-rating').value);
    const comment = document.getElementById('testi-pesan').value;
    
    try {
        await fetch('http://192.168.1.141:5000/api/testimonials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, rating, comment })
        });
        
        showToast('✓ Terima kasih atas ulasan manismu!');
        document.getElementById('form-testimoni').reset(); 
        loadTestimonials(); 
        
    } catch (error) {
        showToast('Maaf, gagal mengirim testimoni.');
    }
});
