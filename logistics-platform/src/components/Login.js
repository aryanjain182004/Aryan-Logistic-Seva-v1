import React, { useState } from 'react';
import { auth, db } from '../firebase'; // Import Firebase auth and Firestore
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from "firebase/auth";
import { getDocs, collection, query, where } from "firebase/firestore"; // Use query and where to fetch users
import './Login.css'; // Ensure to import the CSS file

const Login = ({ onLogin }) => { // Accept onLogin as a prop
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate(); // Use useNavigate for navigation

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // Sign in the user with email and password
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user; // Get user info
            
            console.log("User authenticated:", user);

            // Query Firestore for the user with the matching email
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where("email", "==", email)); // Find user by email
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Get the user document
                const userData = querySnapshot.docs[0].data();
                
                console.log("User data from Firestore:", userData);

                // Call the onLogin prop with the user's role
                onLogin(userData.role); // Pass the role to the App component

                // Navigate to the dashboard based on the user role
                if (userData.role === 'user') {
                    navigate('/user-dashboard');
                } else if (userData.role === 'driver') {
                    navigate('/driver-dashboard');
                } else if (userData.role === 'admin') {
                    navigate('/admin-dashboard');
                }
            } else {
                alert("User record not found in Firestore!");
            }
        } catch (error) {
            console.error("Login error:", error);
            alert(error.message); // Show error message
        }
    };

    return (
        <div className="login-container"> {/* Add a class for background styling */}
            <form className="login-form" onSubmit={handleLogin}>
                <h1 className="login-title">LOGIN</h1> {/* Title added */}
                <div className="form-group">
                    <input
                        type="email"
                        className="form-control"
                        placeholder="Email"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <input
                        type="password"
                        className="form-control"
                        placeholder="Password"
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary">Login</button>
                <p>Don't have an account? 
                    <button 
                        type="button" 
                        onClick={() => navigate('/register')} // Use navigate instead of anchor tag
                        className="btn btn-link"
                    >
                        Register here
                    </button>
                </p>
            </form>
        </div>
    );
};

export default Login;
