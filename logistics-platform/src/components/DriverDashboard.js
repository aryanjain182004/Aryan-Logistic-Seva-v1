import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { Table, Button, Alert, Container } from 'reactstrap'; // Importing Bootstrap components
import { collection, getDocs, updateDoc, doc, query, where, getDoc } from 'firebase/firestore';
import './DriverDashboard.css'; // Add custom CSS for styling

const DriverDashboard = () => {
    const [bookings, setBookings] = useState([]);
    const [acceptedBookings, setAcceptedBookings] = useState([]);
    const [acceptanceMessage, setAcceptanceMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [driverId, setDriverId] = useState('');

    useEffect(() => {
        const fetchDriverIdAndBookings = async () => {
            setAcceptanceMessage("");
            setErrorMessage("");

            const userEmail = auth.currentUser?.email;
            if (!userEmail) {
                console.error("User not logged in");
                setErrorMessage("User not logged in.");
                return;
            }

            const usersCollection = collection(db, 'users');
            const userQuery = query(usersCollection, where("email", "==", userEmail));
            const userSnapshot = await getDocs(userQuery);

            if (!userSnapshot.empty) {
                const userData = userSnapshot.docs[0].data();
                setDriverId(userData.userid);

                // Fetch accepted bookings for the logged-in driver
                const acceptedBookingQuery = query(collection(db, 'bookings'), where("driverId", "==", userData.userid));
                const acceptedBookingSnapshot = await getDocs(acceptedBookingQuery);
                const acceptedBookingData = acceptedBookingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAcceptedBookings(acceptedBookingData.filter(booking => booking.status === 'accepted'));
            } else {
                setErrorMessage("Driver not found.");
                return;
            }

            const bookingCollection = collection(db, 'bookings');
            const bookingSnapshot = await getDocs(bookingCollection);
            const bookingData = bookingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const pendingBookings = bookingData.filter(booking => booking.status === 'pending');
            setBookings(pendingBookings);
        };

        fetchDriverIdAndBookings();
    }, []);

    const acceptBooking = async (bookingId) => {
        const bookingRef = doc(db, 'bookings', bookingId);
        const bookingDoc = await getDoc(bookingRef);
        if (!bookingDoc.exists()) {
            setErrorMessage("No such booking exists.");
            return;
        }

        try {
            await updateDoc(bookingRef, {
                status: 'accepted',
                driverId
            });

            setAcceptanceMessage("Booking Accepted!");
            setBookings(prevBookings => prevBookings.filter(booking => booking.id !== bookingId));
            const acceptedBooking = { id: bookingId, ...bookingDoc.data(), status: 'accepted', driverId };
            setAcceptedBookings(prev => [...prev, acceptedBooking]);

            updateDriverLocation(bookingId);
        } catch (error) {
            setErrorMessage("Failed to accept booking.");
        }
    };

    const updateJobStatus = async (bookingId, newStatus) => {
        const bookingRef = doc(db, 'bookings', bookingId);

        try {
            await updateDoc(bookingRef, {
                status: newStatus
            });

            setAcceptedBookings(prevBookings => 
                prevBookings.map(booking => 
                    booking.id === bookingId ? { ...booking, status: newStatus } : booking
                )
            );
        } catch (error) {
            setErrorMessage("Failed to update status.");
        }
    };

    const updateDriverLocation = async (bookingId) => {
        if (driverId) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                const driverLocation = { latitude, longitude };

                const bookingRef = doc(db, 'bookings', bookingId);
                await updateDoc(bookingRef, { driverLocation });
            });
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            acceptedBookings.forEach(booking => {
                updateDriverLocation(booking.id);
            });
        }, 5000);
        return () => clearInterval(interval);
    }, [acceptedBookings]);

    return (
        <Container className="driver-dashboard">
            <div className="dashboard-content">
                <h2>Driver Dashboard</h2>
                {acceptanceMessage && <Alert color="success">{acceptanceMessage}</Alert>}
                {errorMessage && <Alert color="danger">{errorMessage}</Alert>}

                <h3>Available Bookings</h3>
                {bookings.length > 0 ? (
                    <Table bordered hover>
                        <thead>
                            <tr>
                                <th>Pickup</th>
                                <th>Drop-off</th>
                                <th>Vehicle Type</th>
                                <th>Cost</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map(booking => (
                                <tr key={booking.id} className="table-row">
                                    <td>{booking.pickup}</td>
                                    <td>{booking.dropoff}</td>
                                    <td>{booking.vehicleType}</td>
                                    <td>{booking.cost}</td>
                                    <td className={`status-${booking.status}`}>{booking.status}</td>
                                    <td>
                                        <Button color="primary" onClick={() => acceptBooking(booking.id)}>Accept</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ) : (
                    <p>No available bookings.</p>
                )}

                <h3>Accepted Bookings</h3>
                {acceptedBookings.length > 0 ? (
                    <Table bordered hover>
                        <thead>
                            <tr>
                                <th>Pickup</th>
                                <th>Drop-off</th>
                                <th>Vehicle Type</th>
                                <th>Cost</th>
                                <th>Status</th>
                                <th>Update Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {acceptedBookings.map(booking => (
                                <tr key={booking.id} className="table-row">
                                    <td>{booking.pickup}</td>
                                    <td>{booking.dropoff}</td>
                                    <td>{booking.vehicleType}</td>
                                    <td>{booking.cost}</td>
                                    <td className={`status-${booking.status}`}>{booking.status}</td>
                                    <td>
                                        <select onChange={(e) => updateJobStatus(booking.id, e.target.value)} className="status-select">
                                            <option value="">Update Status</option>
                                            <option value="en route to pickup">En Route to Pickup</option>
                                            <option value="goods collected">Goods Collected</option>
                                            <option value="delivered">Delivered</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ) : (
                    <p>No accepted bookings.</p>
                )}
            </div>
            <img src="https://t3.ftcdn.net/jpg/01/02/03/80/360_F_102038045_1ropJBtqleEFaOu7V37WWpOe7ccUZM7R.jpg" alt="Driver Avatar" className="dashboard-image" />
        </Container>
    );
};

export default DriverDashboard;
