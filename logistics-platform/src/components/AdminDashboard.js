import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { Container, Table, Alert, Card, CardBody, CardHeader, Row, Col, Badge } from 'reactstrap';
import { collection, getDocs, query, where } from 'firebase/firestore';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');

    const fetchUsers = async () => {
        try {
            const usersCollection = collection(db, 'users');
            const userQuery = query(usersCollection, where("role", "==", "user"));
            const userSnapshot = await getDocs(userQuery);
            const userData = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(userData);
        } catch (error) {
            setErrorMessage("Error fetching users: " + error.message);
        }
    };

    const fetchDrivers = async () => {
        try {
            const driversCollection = collection(db, 'users');
            const driverQuery = query(driversCollection, where("role", "==", "driver"));
            const driverSnapshot = await getDocs(driverQuery);
            const driverData = driverSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDrivers(driverData);
        } catch (error) {
            setErrorMessage("Error fetching drivers: " + error.message);
        }
    };

    const fetchBookings = async () => {
        try {
            const bookingsCollection = collection(db, 'bookings');
            const bookingsSnapshot = await getDocs(bookingsCollection);
            const bookingData = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBookings(bookingData);
        } catch (error) {
            setErrorMessage("Error fetching bookings: " + error.message);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchDrivers();
        fetchBookings();
    }, []);

    // Function to get the color based on status
    const getStatusColor = (status) => {
        switch (status) {
            case 'accepted':
                return 'green';
            case 'pending':
                return 'red';
            case 'delivered':
                return 'yellow';
            default:
                return 'black'; // Default color for unknown status
        }
    };

    return (
        <Container className="my-4" style={{ backgroundColor: '#ffccdd' }}>
            <h2 className="text-center text-primary">Admin Dashboard</h2>
            {errorMessage && <Alert color="danger">{errorMessage}</Alert>}

            {/* Users Section */}
            <Card className="mb-4">
                <CardHeader className="bg-primary text-white d-flex align-items-center">
                    <img 
                        src="https://img.favpng.com/2/24/0/computer-icons-avatar-user-profile-png-favpng-HPjiNes3x112h0jw38sbfpDY9.jpg" 
                        alt="User Icon" 
                        style={{ width: '50px', height: '50px', marginRight: '10px' }} 
                    />
                    <h3>Users <Badge color="light">{users.length}</Badge></h3>
                </CardHeader>
                <CardBody>
                    <Table bordered hover responsive>
                        <thead className="bg-light">
                            <tr>
                                <th>#</th>
                                <th>Email</th>
                                <th>User ID</th>
                                <th>Bookings</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, index) => {
                                const userBookings = bookings.filter(booking => booking.userid === user.userid);
                                return (
                                    <tr key={user.id}>
                                        <td>{index + 1}</td>
                                        <td>{user.email}</td>
                                        <td>{user.userid}</td>
                                        <td>
                                            {userBookings.length > 0 ? (
                                                <Table borderless>
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Pickup</th>
                                                            <th>Drop-off</th>
                                                            <th>Cost</th>
                                                            <th>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {userBookings.map((booking, idx) => (
                                                            <tr key={booking.id}>
                                                                <td>{idx + 1}</td>
                                                                <td>{booking.pickup}</td>
                                                                <td>{booking.dropoff}</td>
                                                                <td>{booking.cost}</td>
                                                                <td style={{ color: getStatusColor(booking.status) }}>
                                                                    {booking.status}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            ) : (
                                                <p>No bookings found.</p>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </CardBody>
            </Card>

            {/* Drivers Section */}
            <Card className="mb-4">
                <CardHeader className="bg-success text-white d-flex align-items-center">
                    <img 
                        src="https://t3.ftcdn.net/jpg/01/02/03/80/360_F_102038045_1ropJBtqleEFaOu7V37WWpOe7ccUZM7R.jpg" 
                        alt="Driver Icon" 
                        style={{ width: '50px', height: '50px', marginRight: '10px' }} 
                    />
                    <h3>Drivers <Badge color="light">{drivers.length}</Badge></h3>
                </CardHeader>
                <CardBody>
                    <Table bordered hover responsive>
                        <thead className="bg-light">
                            <tr>
                                <th>#</th>
                                <th>Email</th>
                                <th>Driver ID</th>
                                <th>Bookings Accepted</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drivers.map((driver, index) => {
                                const driverBookings = bookings.filter(booking => booking.driverId === driver.userid);
                                return (
                                    <tr key={driver.id}>
                                        <td>{index + 1}</td>
                                        <td>{driver.email}</td>
                                        <td>{driver.userid}</td>
                                        <td>
                                            {driverBookings.length > 0 ? (
                                                <Table borderless>
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Pickup</th>
                                                            <th>Drop-off</th>
                                                            <th>Cost</th>
                                                            <th>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {driverBookings.map((booking, idx) => (
                                                            <tr key={booking.id}>
                                                                <td>{idx + 1}</td>
                                                                <td>{booking.pickup}</td>
                                                                <td>{booking.dropoff}</td>
                                                                <td>{booking.cost}</td>
                                                                <td style={{ color: getStatusColor(booking.status) }}>
                                                                    {booking.status}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            ) : (
                                                <p>No bookings found.</p>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </CardBody>
            </Card>
        </Container>
    );
};

export default AdminDashboard;
