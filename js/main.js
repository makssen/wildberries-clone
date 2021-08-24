const mySwiper = new Swiper('.swiper-container', {
    loop: true,

    // Navigation arrows
    navigation: {
        nextEl: '.slider-button-next',
        prevEl: '.slider-button-prev',
    },
});


const buttonCart = document.querySelector('.button-cart');
const modalCart = document.querySelector('#modal-cart');
const modalClose = document.querySelector('.modal-close');
const overlay = document.querySelector('.overlay');

//scroll smooth

(() => {
    const scrollLinks = document.querySelectorAll('a.scroll-link');
    scrollLinks.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const id = item.getAttribute('href');
            document.querySelector(id).scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    });
})()

const more = document.querySelector('.more');
const navigationLink = document.querySelectorAll('.navigation-link');
const longGoodsList = document.querySelector('.long-goods-list');
const cartTableGoods = document.querySelector('.cart-table__goods');
const cartTableTotal = document.querySelector('.card-table__total');
const cartCount = document.querySelector('.cart-count');

const getGoods = async() => {
    const response = await fetch('../wildberries-clone/db/db.json');
    if (!response.ok) {
        throw `Goods not load ${response.status}`;
    }
    return response.json();
}

const cart = {
    cartGoods: [],
    countCart: () => {
        const count = cart.cartGoods.reduce((sum, item) => {
            return sum + item.count;
        }, 0);
        cartCount.textContent = count > 0 ? count : '';
    },
    renderCart: () => {
        cartTableGoods.textContent = '';
        cart.cartGoods.forEach(({ id, name, price, count }) => {
            const trGood = document.createElement('tr');
            trGood.classList.add('cart-item');
            trGood.dataset.id = id;
            trGood.innerHTML = `
				<td>${name}</td>
				<td>${price}$</td>
				<td><button class="cart-btn-minus">-</button></td>
				<td>${count}</td>
				<td><button class="cart-btn-plus">+</button></td>
				<td>${price * count}$</td>
				<td><button class="cart-btn-delete">x</button></td>
			`;
            cartTableGoods.append(trGood)
        });

        const totalPrice = cart.cartGoods.reduce((sum, item) => {
            return sum + item.price * item.count;
        }, 0);

        cartTableTotal.textContent = `$${totalPrice}`;
    },
    deleteGood: (id) => {
        cart.cartGoods = cart.cartGoods.filter(item => item.id !== id);
        cart.renderCart();
        cart.countCart()
    },
    plusGood: (id) => {
        for (const item of cart.cartGoods) {
            if (item.id === id) {
                item.count++;
                break;
            }
        }
        cart.renderCart();
        cart.countCart()
    },
    minusGood: (id) => {
        for (const item of cart.cartGoods) {
            if (item.id === id) {
                if (item.count <= 1) {
                    cart.deleteGood(id);
                } else {
                    item.count--;
                }
                break;
            }
        }
        cart.renderCart();
        cart.countCart()
    },
    addCartGoods: (id) => {
        const goodItem = cart.cartGoods.find(item => item.id === id);
        if (goodItem) {
            cart.plusGood(id);
        } else {
            getGoods()
                .then(data => data.find(item => item.id === id))
                .then(({ id, name, price }) => {
                    cart.cartGoods.push({
                        id,
                        name,
                        price,
                        count: 1
                    });
                    cart.countCart();
                })
        }
    }
}

cart.countCart();

document.body.addEventListener('click', (e) => {
    const addToCart = e.target.closest('.add-to-cart');

    if (addToCart) {
        cart.addCartGoods(addToCart.dataset.id);
    }
});


cartTableGoods.addEventListener('click', (e) => {
    const target = e.target;
    if (target.classList.contains('cart-btn-delete')) {
        cart.deleteGood(target.closest('.cart-item').dataset.id);
    }
    if (target.classList.contains('cart-btn-plus')) {
        cart.plusGood(target.closest('.cart-item').dataset.id);
    }
    if (target.classList.contains('cart-btn-minus')) {
        cart.minusGood(target.closest('.cart-item').dataset.id);
    }
});


const openModal = () => {
    modalCart.classList.add('show');
    cart.renderCart();
}

const closeModal = (e) => {
    modalCart.classList.remove('show');
}

const createdCard = (obj) => {
    const card = document.createElement('div');
    card.className = 'col-lg-3 col-sm-6';

    card.innerHTML = `
		<div class="goods-card">
			<span class="label">${obj.label}</span>
			<img src=${obj.img} alt=${obj.name} class="goods-image">
			<h3 class="goods-title">${obj.name}</h3>
			<p class="goods-description">${obj.description}</p>
			<button class="button goods-card-btn add-to-cart" data-id=${obj.id}>
				<span class="button-price">$${obj.price}</span>
			</button>
		</div>
	`;

    return card;
}

const renderCards = (data) => {
    longGoodsList.textContent = '';
    const cards = data.map(createdCard);
    longGoodsList.append(...cards);
    document.body.classList.add('show-goods');
}

more.addEventListener('click', (e) => {
    e.preventDefault();
    getGoods().then(renderCards);
});

const filterCard = (field, value) => {
    getGoods()
        .then(data => {
            const filteredGoods = data.filter(item => field ? item[field] === value : item);
            return filteredGoods;
        })
        .then(renderCards)
}

navigationLink.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const field = item.dataset.field || null;
        const value = item.textContent;
        filterCard(field, value);
    });
});


buttonCart.addEventListener('click', openModal);
modalClose.addEventListener('click', closeModal);
modalCart.addEventListener('click', (e) => {
    const target = e.target;
    if (target.classList.contains('overlay') || target.classList.contains('modal-close')) {
        closeModal();
    }
});

const form = document.querySelector('.modal-form');

const postData = (dataUser) => fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    body: JSON.stringify(dataUser),
    headers: {
        'Content-type': 'application/json',
    }
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.nameCustomer.value;
    const phone = form.phoneCustomer.value;
    const total = cartTableTotal.textContent;
	if(name && phone && cart.cartGoods.length > 0){ 
    postData({ name, phone, total })
        .then(response => {
            if (!response.ok) {
                throw new Error(response.status);
            }
            alert('Success');
            return response.json()
        })
        .then(response => console.log(response))
        .catch(err => {
            alert('Error');
            console.log(err)
        })
        .finally(() => {
            closeModal();
            form.reset();
            cart.cartGoods.length = 0;
            cart.countCart();
        })
	}else{
		alert('Add product or fill in the fields');
	}
});
