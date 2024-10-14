import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import UserDashboard from './components/UserDashboard';
import DriverDashboard from './components/DriverDashboard';
import AdminDashboard from './components/AdminDashboard';
import BookingForm from './components/BookingForm';
import { auth, db } from './firebase'; // Import Firestore and Auth
import { collection, query, where, getDocs } from "firebase/firestore";

const App = () => {
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true); // Loading state

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                // User is signed in, get their role from Firestore
                const fetchUserRole = async () => {
                    try {
                        const usersRef = collection(db, 'users');
                        const q = query(usersRef, where("email", "==", user.email));
                        const querySnapshot = await getDocs(q);
                        
                        if (!querySnapshot.empty) {
                            const userData = querySnapshot.docs[0].data();
                            setRole(userData.role); // Set user role from Firestore
                        }
                    } catch (error) {
                        console.error("Error fetching user role: ", error);
                    } finally {
                        setLoading(false); // Set loading to false after fetching
                    }
                };

                fetchUserRole();
            } else {
                setRole(null); // User is signed out
                setLoading(false); // Set loading to false
            }
        });

        return () => unsubscribe(); // Cleanup subscription on unmount
    }, []);

    const handleLogin = (role) => {
        setRole(role); // Set user role
    };

    // Redirect based on user role after login
    const redirectToDashboard = () => {
        if (role === 'user') return "/user-dashboard";
        if (role === 'driver') return "/driver-dashboard";
        if (role === 'admin') return "/admin-dashboard";
        return "/login";
    };

    return (
        <Router>
            <div className="container">
                <h1>ARYAN LOGISTICS SEVA</h1>
                {loading ? (
                    <p>Loading...</p> // Loading indicator
                ) : (
                    <Routes>
                        <Route path="/" element={<Register />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/login" element={<Login onLogin={handleLogin} />} />
                        
                        <Route path="/user-dashboard" element={
                            role === 'user' ? (
                                <UserDashboard />
                            ) : (
                                <Navigate to="/login" />
                            )
                        } />

                        <Route path="/driver-dashboard" element={
                            role === 'driver' ? (
                                <DriverDashboard />
                            ) : (
                                <Navigate to="/login" />
                            )
                        } />

                        <Route path="/admin-dashboard" element={
                            role === 'admin' ? (
                                <AdminDashboard />
                            ) : (
                                <Navigate to="/login" />
                            )
                        } />

                        <Route path="/booking" element={
                            role ? (
                                <BookingForm />
                            ) : (
                                <Navigate to="/login" />
                            )
                        } />

                        <Route path="*" element={<Navigate to={redirectToDashboard()} />} />
                    </Routes>
                )}
            </div>
        </Router>
    );
};

export default App;
