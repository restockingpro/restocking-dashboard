import React, { useState, useEffect } from "react";
import "./App.css";
import { createClient } from "@supabase/supabase-js";

type Page = "overview" | "links";

/* --------- SUPABASE CLIENT (VITE) --------- */
const supabaseUrl = "https://plhdroogujwxugpmkpta.supabase.co";

const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsaGRyb29ndWp3eHVncG1rcHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2ODA4MDMsImV4cCI6MjA3OTI1NjgwM30.iNXj1oO_Bb5zv_uq-xJLuIWhqC3eQNOxvYsWUUL8rtE";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/* --------- AMAZON DEPARTMENTS (TOP LEVEL) --------- */
const AMAZON_DEPARTMENTS = [
  "Appliances",
  "Arts, Crafts & Sewing",
  "Automotive",
  "Baby",
  "Beauty & Personal Care",
  "Books",
  "Camera & Photo",
  "Cell Phones & Accessories",
  "Clothing, Shoes & Jewelry",
  "Collectibles & Fine Art",
  "Computers",
  "Electronics",
  "Grocery & Gourmet Food",
  "Health & Household",
  "Home & Kitchen",
  "Industrial & Scientific",
  "Kitchen & Dining",
  "Movies & TV",
  "Musical Instruments",
  "Office Products",
  "Patio, Lawn & Garden",
  "Pet Supplies",
  "Sports & Outdoors",
  "Tools & Home Improvement",
  "Toys & Games",
  "Video Games",
] as const;

/* --------- SMALL COMPONENTS --------- */

type StatCardProps = {
  label: string;
  value: string;
  description?: string;
};

function StatCard({ label, value, description }: StatCardProps) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {description && <span className="stat-desc">{description}</span>}
    </div>
  );
}

type RestockRow = {
  supplier: string;
  product: string;
  sku: string;
  lastRestock: string;
  status: "Hot" | "Normal" | "Watch";
};

function RestockTable() {
  const rows: RestockRow[] = [
    {
      supplier: "Supplier A",
      product: "Davidoff Cool Water 4.2oz",
      sku: "DCW-42",
      lastRestock: "2 hours ago",
      status: "Hot",
    },
    {
      supplier: "Supplier B",
      product: "Legendary Protein Bar 12ct",
      sku: "LEG-BAR-12",
      lastRestock: "Yesterday",
      status: "Normal",
    },
    {
      supplier: "Supplier C",
      product: "Renpure Shampoo 16oz",
      sku: "REN-16",
      lastRestock: "3 days ago",
      status: "Watch",
    },
  ];

  const getBadgeClass = (status: RestockRow["status"]) => {
    if (status === "Hot") return "badge badge-hot";
    if (status === "Watch") return "badge badge-watch";
    return "badge badge-normal";
  };

  return (
    <div className="table-wrapper">
      <div className="table-header">
        <div>
          <h2>Recent Restocks</h2>
          <p>Latest supplier restocks being tracked by RestocKING.</p>
        </div>
        <button className="btn-secondary">View all</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Supplier</th>
            <th>Product</th>
            <th>SKU</th>
            <th>Last Restock</th>
            <th className="right">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.sku}>
              <td>{row.supplier}</td>
              <td>{row.product}</td>
              <td>{row.sku}</td>
              <td>{row.lastRestock}</td>
              <td className="right">
                <span className={getBadgeClass(row.status)}>{row.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------- SIDEBAR / TOPBAR -------- */

type SidebarProps = {
  currentPage: Page;
  onChangePage: (page: Page) => void;
};

const navItems: {
  label: string;
  key: Page | "history" | "settings" | "billing";
}[] = [
  { label: "Overview", key: "overview" },
  { label: "Supplier Links", key: "links" },
  { label: "Restock Alerts", key: "history" },
  { label: "History", key: "history" },
  { label: "Settings", key: "settings" },
  { label: "Billing", key: "billing" },
];

function Sidebar({ currentPage, onChangePage }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="logo-block">
        <div className="logo-icon">🦍</div>
        <div>
          <div className="logo-title">RESTOCKING</div>
          <div className
