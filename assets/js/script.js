import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js";
import { getDatabase, ref, child, get, push, set, update, remove, onValue, onChildAdded, onChildRemoved } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import * as Popper from 'https://cdn.jsdelivr.net/npm/@popperjs/core@^2/dist/esm/index.js'

const firebaseConfig = {
    apiKey: "AIzaSyBV-d4pDFcNFsGsw1W8OqnsNMeUeAY4KSw",
    authDomain: "awesome-sphere-443815-f7.firebaseapp.com",
    databaseURL: "https://awesome-sphere-443815-f7-default-rtdb.firebaseio.com",
    projectId: "awesome-sphere-443815-f7",
    storageBucket: "awesome-sphere-443815-f7.firebasestorage.app",
    messagingSenderId: "77025331867",
    appId: "1:77025331867:web:2a4c34696172bcbcd5543e",
    measurementId: "G-SPELKYBK7W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase();
const dbRef = ref(getDatabase());
const chatsRef = ref(db, 'chats');
const auth = getAuth(app);
let currentUser;

const buttonLogout = document.querySelector("[button-logout]");
const buttonLogin = document.querySelector("[button-login]");
const buttonRegister = document.querySelector("[button-register]");
const chat = document.querySelector("[chat]");

// Kiểm Tra Trạng Thái Đăng Nhập`
onAuthStateChanged(auth, (user) => {
    if (user) {
        buttonLogout.style.display = "inline";
        chat.style.display = "block";
        currentUser = user;
    } else {
        buttonLogin.style.display = "inline";
        buttonRegister.style.display = "inline";
        if (chat) {
            chat.innerHTML = "Vui lòng đăng nhập để sử dụng ứng dụng!";
        }
    }
});
// End Kiểm Tra Trạng Thái Đăng Nhập


//Trang Đăng Ký
const formRegister = document.querySelector("#form-register");
if (formRegister) {
    formRegister.addEventListener("submit", (event) => {
        event.preventDefault()

        const fullName = formRegister.fullName.value;
        const email = formRegister.email.value;
        const password = formRegister.password.value;

        if (fullName && email && password) {
            createUserWithEmailAndPassword(auth, email, password).then((userCredential) => {
                // Signed up 
                const user = userCredential.user;
                if (user) {
                    set(ref(db, `users/${user.uid}`), {
                        fullName: fullName
                    })
                        .then(() => {
                            window.location.href = "/index.html";
                        });
                }
            })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.error(errorMessage);
                });
        }
    });
}
//End Trang Đăng Ký

//Trang Đăng Nhập
const formLogin = document.querySelector("#form-login");
if (formLogin) {
    formLogin.addEventListener("submit", (event) => {
        event.preventDefault()

        const email = formLogin.email.value;
        const password = formLogin.password.value;

        if (email && password) {
            signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
                // Signed up 
                const user = userCredential.user;
                if (user) {
                    window.location.href = "index.html";
                } else {
                    alert("Sai Email và Mật Khẩu!")
                }
            })
        }
    });
}
//End Trang Đăng Nhập

// Đăng Xuất
if (buttonLogout) {
    buttonLogout.addEventListener("click", () => {
        signOut(auth).then(() => {
            window.location.href = "/login.html";
        }).catch((error) => {
            console.error(error);
        });
    });
}
// End Đăng Xuất

//Form Chat
const formChat = document.querySelector("[chat] .inner-form");
if (formChat) {
    // Upload Image
    const uploadImages = new FileUploadWithPreview.FileUploadWithPreview('upload-images', {
        maxFileCount: 6,
        multiple: true
    });

    formChat.addEventListener("submit", async (event) => {
        event.preventDefault();

        const content = formChat.content.value;
        const userId = auth.currentUser.uid;
        const images = uploadImages.cachedFileArray || [];

        if ((content || images.length > 0) && userId) {
            const imagesLink = [];

            if (images.length > 0) {
                const url = 'https://api.cloudinary.com/v1_1/dcqxxq8sn/image/upload';

                const formData = new FormData();

                for (let i = 0; i < images.length; i++) {
                    let file = images[i];
                    formData.append('file', file);
                    formData.append('upload_preset', 'a4er6x3q');

                    await fetch(url, {
                        method: 'POST',
                        body: formData,
                    })
                        .then((response) => {
                            return response.json();
                        })
                        .then((data) => {
                            imagesLink.push(data.url);
                        });
                }
            }

            set(push(ref(db, "chats")), {
                content: content,
                images: imagesLink,
                userId: userId
            });

            formChat.content.value = "";
            uploadImages.resetPreviewPanel();
        }
    });
}
//End Form Chat

// Hiển Thị Tin Nhắn Mặc Định
const chatBody = document.querySelector("[chat] .inner-body");
if (chatBody) {
    onChildAdded(chatsRef, (data) => {
        const key = data.key;
        const userId = data.val().userId;
        const content = data.val().content;
        const images = data.val().images;

        get(child(dbRef, `users/${userId}`)).then((snapshot) => {
            if (snapshot.exists()) {
                const fullName = snapshot.val().fullName;

                const newChat = document.createElement("div");
                newChat.setAttribute("chat-key", key);

                let htmlFullName = '';
                let htmlButtonDelete = '';

                if (userId === currentUser.uid) {
                    newChat.classList.add("inner-outgoing");
                    htmlButtonDelete = `
                        <button class="button-delete">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    `;
                } else {
                    newChat.classList.add("inner-incoming");
                    htmlFullName = `
                        <div class="inner-name">
                            ${fullName}
                        </div>
                    `;
                }

                let htmlContent = "";
                if (content) {
                    htmlContent = `
                        <div class="inner-content">
                            ${content}
                        </div>
                    `;
                }

                let htmlImages = "";
                if (images && images.length > 0) {
                    htmlImages += "<div class='inner-images'>";
                    images.forEach(image => {
                        htmlImages += `
                            <img src="${image}" />
                        `;
                    });
                    htmlImages += "</div>";
                }

                newChat.innerHTML = `
                    ${htmlFullName}
                    ${htmlContent}
                    ${htmlImages}
                    ${htmlButtonDelete}
                `;

                chatBody.appendChild(newChat);

                chatBody.scrollTop = chatBody.scrollHeight;

                //Xóa Tin Nhắn
                const buttonDelete = newChat.querySelector(".button-delete");
                if (buttonDelete) {
                    buttonDelete.addEventListener("click", () => {
                        remove(ref(db, '/chats/' + key));
                    });
                }
                //End Xóa Tin Nhắn
            } else {
                console.log("No data available");
            }
        }).catch((error) => {
            console.error(error);
        });
    });
}
// End hiển thị tin nhắn mặc đinhj

//Lắng nghe tin nhắn bị xóa
onChildRemoved(chatsRef, (data) => {
    const key = data.key;
    const chatItem = chatBody.querySelector(`[chat-key="${key}"]`);
    if (chatItem) {
        chatItem.remove();
    }
});
//End Lắng nghe tin nhắn bị xóa

// Chèn Icon
const emojiPicker = document.querySelector('emoji-picker');
if (emojiPicker) {
    const button = document.querySelector('.button-icon');
    const buttonIcon = document.querySelector('.button-icon i');
    const tooltip = document.querySelector('.tooltip');
    Popper.createPopper(button, tooltip);
    button.addEventListener("click", () => {
        tooltip.classList.toggle('shown');
    });

    const inputChat = document.querySelector(".chat .inner-form input[name='content']");
    emojiPicker.addEventListener('emoji-click', event => {
        const icon = event.detail.unicode;
        inputChat.value = inputChat.value + icon;
    });

    document.addEventListener("click", (event) => {
        if (!emojiPicker.contains(event.target) && (event.target != button && event.target != buttonIcon)) {
            tooltip.classList.remove('shown');
        }
    });
}
//End Chèn Icon