// src/components/Register.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase'; // Import Firebase auth and Firestore
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection, getDocs } from "firebase/firestore"; // Import Firestore methods
import './Register.css'; // Import the CSS file

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userid, setUserid] = useState(''); // New state for userid
    const [role, setRole] = useState('user'); // Default role
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // Loading state
    const [adminExists, setAdminExists] = useState(false); // New state to track admin existence
    const navigate = useNavigate(); // Initialize navigate

    useEffect(() => {
        const checkAdminRole = async () => {
            const userCollection = collection(db, 'users');
            const userSnapshot = await getDocs(userCollection);
            const users = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const adminUser = users.find(user => user.role === 'admin');
            setAdminExists(!!adminUser); // Set adminExists to true if admin user is found
        };

        checkAdminRole(); // Check for admin role on component mount
    }, []);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(''); // Reset error message
        setLoading(true); // Set loading state to true

        try {
            // Validate email format
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                throw new Error("Invalid email format.");
            }

            // Validate userid input
            if (!userid) {
                throw new Error("User ID cannot be empty.");
            }

            // Prevent registration as admin if an admin already exists
            if (role === 'admin' && adminExists) {
                throw new Error("An admin user already exists. Cannot register another admin.");
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Save user details to Firestore using setDoc
            await setDoc(doc(db, 'users', user.uid), {
                email,
                userid, // Save userid in Firestore
                role,
            });

            // Optionally display a success message
            alert("Registration successful! Redirecting to login...");

            // Redirect to the login page after successful registration
            navigate('/login');
        } catch (error) {
            setError(error.message); // Display error message
        } finally {
            setLoading(false); // Reset loading state
        }
    };

    return (
        <div className="register-container">
            <h2 className="register-title">Register</h2>
            <form onSubmit={handleRegister} className="register-form">
                <div className="form-group">
                    <input
                        type="text" // Change type to text for userid
                        className="form-control"
                        placeholder="User ID"
                        value={userid}
                        onChange={(e) => setUserid(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <input
                        type="email"
                        className="form-control"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <input
                        type="password"
                        className="form-control"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <select value={role} onChange={(e) => setRole(e.target.value)} className="form-control">
                        <option value="user">User</option>
                        <option value="driver">Driver</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                {error && <p className="text-danger">{error}</p>} {/* Displays error message */}
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Registering..." : "Register"}
                </button>
            </form>
            <p className="mt-3">
                Already have an account? <button onClick={() => navigate('/login')} className="btn btn-link">Login here</button>
            </p>
        </div>
    );
};

export default Register;
