import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getDatabase, ref, onValue, remove, get } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";

$(document).ready(function () {
    console.log("🚀 Firebase กำลังโหลด...");

    // ✅ แสดงแท็บ Overview เป็นค่าเริ่มต้น
    $('#myTabs a[href="#overview"]').tab('show');

    // ✅ ตั้งค่า Firebase
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

    // ✅ เริ่มต้น Firebase
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    const sensorRef = ref(db, "sensor");  // ✅ ใช้ sensor แทน logDHT

    // ✅ ตัวแปรเก็บข้อมูลกราฟ
    let tempData = [];
    let humidityData = [];

    // ✅ โหลดข้อมูลจาก Firebase และอัปเดต UI + กราฟ
    onValue(sensorRef, (snapshot) => {
        console.log("📡 Firebase ดึงข้อมูล...");
        if (!snapshot.exists()) {
            console.warn("⚠ ไม่มีข้อมูล sensor ใน Firebase");
            updateUI("N/A", "N/A");
            return;
        }

        // ✅ ดึงข้อมูลจาก sensor
        let sensorData = snapshot.val();
        console.log("✅ ข้อมูลล่าสุดจาก Firebase:", sensorData);

        if (sensorData.temperature === undefined || sensorData.humidity === undefined) {
            console.error("🚨 ข้อมูลที่ได้รับไม่ถูกต้อง:", sensorData);
            updateUI("N/A", "N/A"); // แสดงค่าเป็น "N/A" แทน
            return;
        }        

        let temp = sensorData.temperature.toFixed(1);
        let hum = sensorData.humidity.toFixed(1);
        let time = new Date();

        updateUI(temp, hum);
        updateChart(time, parseFloat(temp), parseFloat(hum));
    });

    // ✅ ฟังก์ชันอัปเดต UI
    function updateUI(temp, hum) {
        $("#temperature .content").text(temp + " °C");
        $("#humidity .content").text(hum + " %");

        let tempBox = $("#temperature");
        let humBox = $("#humidity");

        // ✅ เปลี่ยนสี UI ตามค่า
        if (temp > 40) {
            tempBox.removeClass().addClass("dialog primary animated flash");
            showAlert("⚠️ อุณหภูมิสูงเกิน 40°C!", "กรุณาตรวจสอบระบบระบายความร้อน", "danger");
            playWarningSound();
        } else if (temp > 30) {
            tempBox.removeClass().addClass("dialog primary animated flash");
        } else if (temp < 20) {
            tempBox.removeClass().addClass("dialog info animated flash");
        } else {
            tempBox.removeClass().addClass("dialog primary");
        }

        if (hum < 40) {
            humBox.removeClass().addClass("dialog warning animated flash");
        } else {
            humBox.removeClass().addClass("dialog info");
        }
    }

    // ✅ ฟังก์ชันอัปเดตข้อมูลกราฟ
    function updateChart(time, temperature, humidity) {
        if (tempData.length > 10) tempData.shift();
        if (humidityData.length > 10) humidityData.shift();

        tempData.push({ x: time, y: temperature });
        humidityData.push({ x: time, y: humidity });

        chart.render();
    }

    // ✅ ฟังก์ชันแสดงแจ้งเตือน
    function showAlert(title, message, type) {
        let alertBox = document.createElement("div");
        alertBox.classList.add("alert", "alert-" + type, "fade", "show");
        alertBox.innerHTML = `<strong>${title}</strong> ${message}`;

        document.getElementById("alertContainer").appendChild(alertBox);

        setTimeout(() => {
            alertBox.remove();
        }, 5000);
    }

    // ✅ ฟังก์ชันเล่นเสียงแจ้งเตือน
    function playWarningSound() {
        let audio = new Audio("warning.mp3");
        audio.play();
    }

    // ✅ โหลด Setting เมื่อคลิกแท็บ
    $("#setting-tab").on("click", function (event) {
        event.preventDefault(); // ✅ ป้องกันการโหลดหน้าใหม่
        fetch("setting.html")
            .then(response => response.text())
            .then(data => {
                $("#setting").html(data);
                showTab("setting");
            })
            .catch(error => console.error("Error loading settings:", error));
    });

    // ✅ ฟังก์ชันสลับแท็บ
    function showTab(tabId) {
        $(".tab-pane").removeClass("show active");
        $("#" + tabId).addClass("show active");
    }

    // ✅ สร้างกราฟด้วย CanvasJS
    let chart = new CanvasJS.Chart("chartContainer", {
        theme: "light2",
        title: { text: "Temperature & Humidity Trends" },
        axisX: { title: "Time", valueFormatString: "HH:mm:ss" },
        axisY: [
            { title: "Temperature (°C)", lineColor: "red", tickColor: "red", labelFontColor: "red" },
            { title: "Humidity (%)", lineColor: "blue", tickColor: "blue", labelFontColor: "blue", opposite: true }
        ],
        data: [
            { type: "line", showInLegend: true, name: "Temperature", dataPoints: tempData, color: "red" },
            { type: "line", showInLegend: true, name: "Humidity", dataPoints: humidityData, color: "blue", axisYType: "secondary" }
        ]
    });
});
