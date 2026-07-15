# Cohort Analyser (CohortSuite)

A powerful, client-side analytics dashboard designed to visualize and analyze **Google Analytics 4 (GA4) Cohort Exports**.

Built with **React**, **Vite**, and **Tailwind CSS**, this tool processes raw CSV exports locally in your browser to generate interactive LTV curves, retention heatmaps, and purchase velocity trends without sending data to any server.

## Live App


https://cohortsuite-v9.netlify.app/


## App Screenshots

<img width="2198" height="1043" alt="Image" src="https://github.com/user-attachments/assets/c4e1040c-d546-4851-88f3-bf1109bceec9" />

### 

<img width="2199" height="1041" alt="Image" src="https://github.com/user-attachments/assets/0266d85b-f765-4783-a0b5-458deb337add" />

### 

<img width="2205" height="973" alt="Image" src="https://github.com/user-attachments/assets/1cb06129-7678-4b11-886a-e4187f288af9" />

### 

## 🚀 Features

### 1. Data Ingestion (ETL)

* **Drag & Drop Parsing:** Instantly parses raw GA4 Cohort CSV exports.

* **Auto-Cleaning:** Automatically removes header metadata, calculates percentages, and standardises date formats.

* **Privacy First:** All processing happens in the browser. No data is uploaded to the cloud.

### 2. Cohort Explorer

* **Cumulative LTV Curves:** Visualise cumulative value generation over time using interactive Area charts. Includes toggles to view data in **Absolute** or **Per User** formats for fair cohort comparison.

* **Incremental Growth:** Month-over-month performance visualised with distinct Line charts. Includes a **Logarithmic/Linear** scale toggle to easily track and trace drop-offs in long-tail purchase data.

* **Enhanced Tooltips:** Hover over data points to instantly see month-on-month percentage growth comparisons alongside raw volumes.

* **Performance Grid:** A heatmap-style table showing retention rates and volume per cohort month.

### 3. Velocity Explorer

* **Purchase Velocity:** Track "Purchases Per Day" trends alongside total visitor volume to identify peak performance periods and efficiency gaps.

* **Path Analysis:** Drill down into specific page paths (entry points) to see which landing pages drive the highest LTV, visualised with visitor share gauges and volume curves.

* **Unified Metrics Grid:** Perfectly aligned, glassmorphism UI cards detailing Latest Velocity, Peak Velocity, Total Visitors (with trend indicators), and Average Conversion.

## 🛠️ Tech Stack

* **Framework:** React 18 (Vite)

* **Styling:** Tailwind CSS (Glassmorphism UI)

* **Charts:** Recharts

* **Icons:** Lucide React

* **Utilities:** Lodash

## 💻 Getting Started

### Prerequisites

* Node.js (v16 or higher)

* npm or yarn

### Installation

1. **Clone the repository**

   ```
   git clone [https://github.com/plexy44/cohort-analyser.git](https://github.com/plexy44/cohort-analyser.git)
   cd cohort-analyser
   
   ```

2. **Install dependencies**

   ```
   npm install
   
   ```

3. **Run the development server**

   ```
   npm run dev
   
   ```

## 🚀 Deployment

This project is optimised for deployment on **Netlify** or **Vercel**.

**Build Command:**

```
npm run build
```


