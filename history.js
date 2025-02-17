import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getDatabase, ref, query, orderByChild, startAt, get } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";

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
const logsRef = ref(db, "logs"); // เปลี่ยนจาก logDHT เป็น logs

// ✅ โหลดข้อมูลย้อนหลัง 15 วัน
const fifteenDaysAgo = new Date();
fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

// ✅ ดึงข้อมูลย้อนหลังจาก Firebase
async function loadHistoryData() {
    $("#loadingSpinner").show();
    $("#historyTableBody").html("");

    try {
        const logQuery = query(logsRef, orderByChild("timestamp"), startAt(fifteenDaysAgo.getTime()));
        const snapshot = await get(logQuery);

        $("#loadingSpinner").hide();

        if (!snapshot.exists()) {
            console.warn("❌ ไม่มีข้อมูลย้อนหลัง 15 วัน");
            $("#historyTableBody").html("<tr><td colspan='3'>ไม่มีข้อมูลย้อนหลัง</td></tr>");
            return;
        }

        let dataRows = snapshot.val();
        processHistoricalData(dataRows);
    } catch (error) {
        console.error("❌ Firebase Error:", error);
        $("#loadingSpinner").hide();
        $("#historyTableBody").html("<tr><td colspan='3'>เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>");
    }
}

// ✅ ฟังก์ชันประมวลผลข้อมูลย้อนหลัง
function processHistoricalData(dataRows) {
    let dailyData = {};
    let tableHTML = "";
    let tempData = [];
    let humidityData = [];

    Object.values(dataRows).forEach(row => {
        if (!row.timestamp || row.temperature === undefined || row.humidity === undefined) return;

        let dateKey = formatDateTH(row.timestamp);
        let parsedDate = new Date(row.timestamp);

        if (!dailyData[dateKey]) {
            dailyData[dateKey] = { temperature: row.temperature, humidity: row.humidity, count: 1, rawDate: parsedDate };
        } else {
            dailyData[dateKey].temperature += parseFloat(row.temperature);
            dailyData[dateKey].humidity += parseFloat(row.humidity);
            dailyData[dateKey].count++;
        }
    });

    // ✅ เรียงลำดับวันที่จากเก่าสุดไปใหม่สุด
    let sortedDates = Object.keys(dailyData).sort((a, b) => {
        return dailyData[a].rawDate - dailyData[b].rawDate;
    }).slice(-15);

    sortedDates.forEach(date => {
        let values = dailyData[date];
        let avgTemp = (values.temperature / values.count).toFixed(1);
        let avgHumidity = (values.humidity / values.count).toFixed(0);
        let parsedDate = values.rawDate;

        tableHTML += `
            <tr>
                <td class="text-date">${date}</td>
                <td class="text-danger">${avgTemp} °C</td>
                <td class="text-info">${avgHumidity} %</td>
            </tr>
        `;

        tempData.push({ x: parsedDate, y: parseFloat(avgTemp) });
        humidityData.push({ x: parsedDate, y: parseFloat(avgHumidity) });
    });

    document.getElementById("historyTableBody").innerHTML = tableHTML;

    // ✅ ตรวจสอบว่ามีข้อมูลก่อน render
    if (tempData.length > 0 && humidityData.length > 0) {
        updateChart(tempData, humidityData);
    } else {
        console.warn("⚠️ ไม่มีข้อมูลสำหรับแสดงกราฟ");
    }
}

// ✅ ฟังก์ชันอัปเดตกราฟ
function updateChart(tempData, humidityData) {
    let chart = new CanvasJS.Chart("chartContainer", {
        theme: "light2",
        title: { text: "Daily Average Temperature & Humidity", fontSize: 22, fontWeight: "bold" },
        axisX: { title: "Date", valueFormatString: "DD MMM" },
        axisY: { title: "Temperature (°C)", includeZero: false, gridThickness: 0.5, lineColor: "#ff0000" },
        axisY2: { title: "Humidity (%)", includeZero: false, gridThickness: 0.5, lineColor: "#007bff" },
        animationEnabled: true,
        data: [
            { type: "line", name: "Temperature", showInLegend: true, markerSize: 5, lineColor: "#ff0000", color: "#ff0000", dataPoints: tempData },
            { type: "line", name: "Humidity", axisYType: "secondary", showInLegend: true, markerSize: 5, lineColor: "#007bff", color: "#007bff", dataPoints: humidityData }
        ]
    });

    chart.render();
}

// ✅ ฟังก์ชันจัดรูปแบบวันที่เป็น "6 ก.พ."
function formatDateTH(timestamp) {
    const monthsTH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", 
                      "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

    let date = new Date(parseInt(timestamp));
    let day = date.getDate();
    let month = monthsTH[date.getMonth()];
    let year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

// ✅ เรียกใช้งานโหลดข้อมูลเมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ history.js is running...");
    loadHistoryData();
});