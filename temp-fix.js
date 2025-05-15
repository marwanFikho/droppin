// This is a temporary file to store all the needed imports and variables for the admin dashboard
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminService, packageService } from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faStore, faTruck, faBox, faSearch, faEye, faCheck, faTimes, faChartBar, faUserPlus, faTimes as faClose } from '@fortawesome/free-solid-svg-icons';
import './AdminDashboard.css';

// These are the state variables needed for the new settlement functionality
const [shops, setShops] = useState([]);
const [allPackages, setAllPackages] = useState([]);
const [packagesToSettle, setPackagesToSettle] = useState([]);
const [shopToSettle, setShopToSettle] = useState(null);
const [showSettleModal, setShowSettleModal] = useState(false);
const [settleModalContent, setSettleModalContent] = useState({ title: '', packages: [], totalAmount: 0 });
const [isSubmitting, setIsSubmitting] = useState(false);

// Function to fetch shops list
const fetchShops = async () => {
  try {
    const response = await adminService.getShops();
    setShops(response.data);
    console.log('Fetched shops:', response.data);
  } catch (error) {
    console.error('Error fetching shops:', error);
  }
};

// Function to fetch all packages 
const fetchAllPackages = async () => {
  try {
    const response = await adminService.getPackages();
    setAllPackages(response.data);
    console.log('Fetched all packages:', response.data);
  } catch (error) {
    console.error('Error fetching all packages:', error);
  }
};

// Function to close the settlement modal
const handleCloseSettleModal = () => {
  setShowSettleModal(false);
  setPackagesToSettle([]);
  setShopToSettle(null);
  setSettleModalContent({ title: '', packages: [], totalAmount: 0 });
};
