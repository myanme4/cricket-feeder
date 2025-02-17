console.log("🚀 setting.js is running...");

// ✅ นำเข้า Firebase เวอร์ชันใหม่ (v9+)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";

// ✅ เชื่อมต่อ Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDwOyp...",
    authDomain: "dht22-14f97.firebaseapp.com",
    databaseURL: "https://dht22-14f97-default-rtdb.firebaseio.com",
    projectId: "dht22-14f97",
    storageBucket: "dht22-14f97.appspot.com",
    messagingSenderId: "131749789651",
    appId: "1:131749789651:web:20c7b9cbd9fca47ee2b926",
    measurementId: "G-RKV9EL32X4"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const controlRef = ref(db, "controls");

// ✅ ฟังก์ชันอัปเดตโหมดไป Firebase
function updateMode(id, mode) {
    set(ref(db, `/controls/mode/${id}`), mode)
        .then(() => console.log(`✅ Updated mode /controls/mode/${id} to ${mode}`))
        .catch(error => console.error(`❌ Error updating mode /controls/mode/${id}:`, error));
}

// ✅ ฟังก์ชันอัปเดตค่าไป Firebase
function updateControl(id, state) {
    set(ref(db, `/controls/${id}`), state)
        .then(() => console.log(`✅ Updated /controls/${id} to ${state}`))
        .catch(error => console.error(`❌ Error updating /controls/${id}:`, error));
}

// ✅ โหลดค่าเริ่มต้นจาก Firebase
function loadSettings() {
    onValue(controlRef, snapshot => { // <-- แก้ไขตรงนี้
        if (!snapshot.exists()) return;
        const data = snapshot.val();

        // ✅ โหลดค่าโหมดจาก Firebase (ถ้าไม่มี ให้ใช้ค่า "auto")
        const lightMode = data.mode?.light || "auto";  
        const fanMode = data.mode?.fan || "auto";

        // ✅ โหลดค่าเปิด/ปิดจาก Firebase
        const toggleLight = document.getElementById("toggle-light");
        const toggleFan = document.getElementById("toggle-fan");

        if (toggleLight) {
            toggleLight.checked = !!data.light;
            toggleLight.dataset.mode = lightMode;
        }
        if (toggleFan) {
            toggleFan.checked = !!data.fan;
            toggleFan.dataset.mode = fanMode;
        }

        console.log(`🔄 Loaded settings: Light=${data.light}, Mode=${lightMode}`);
        console.log(`🔄 Loaded settings: Fan=${data.fan}, Mode=${fanMode}`);
    }, error => {
        console.error("❌ Firebase Load Error:", error);
    });
}

// ✅ โหลดค่าจาก Firebase และกำหนด Event เมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener("DOMContentLoaded", function() {
    console.log("🌐 Setting page loaded...");
    loadSettings();

    // ✅ ดึง Element แต่ละตัว
    const toggleLight = document.getElementById("toggle-light");
    const toggleFan = document.getElementById("toggle-fan");
    const feedFood = document.getElementById("feed-food");
    const feedWater = document.getElementById("feed-water");

    // ✅ ตรวจสอบก่อนใช้ .addEventListener()
    if (toggleLight) {
        toggleLight.addEventListener("change", function() {
            updateMode("light", "manual");
            updateControl("light", this.checked);
        });
    }

    if (toggleFan) {
        toggleFan.addEventListener("change", function() {
            updateMode("fan", "manual");
            updateControl("fan", this.checked);
        });
    }

    if (feedFood) {
        feedFood.addEventListener("click", async () => {
            await updateMode("feed_motor", "manual");
            await updateControl("feed_motor", true);
            alert("✅ กำลังให้อาหาร...");
        
            await new Promise(resolve => setTimeout(resolve, 5000));
            await updateControl("feed_motor", false);
        
            await updateMode("spread_motor", "manual");
            await updateControl("spread_motor", true);
            alert("🔄 กำลังเกลี่ยอาหาร...");
        
            await new Promise(resolve => setTimeout(resolve, 5000));
            await updateControl("spread_motor", false);
        
            alert("✅ ให้อาหารเสร็จแล้ว!");
        });        
    }

    if (feedWater) {
        feedWater.addEventListener("click", () => {
            updateMode("water_valve", "manual");
            updateControl("water_valve", true);
            setTimeout(() => updateControl("water_valve", false), 5000);
            alert("✅ ให้น้ำแล้ว!");
        });
    }
});
