import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { Container, Button, Table, Alert, Row, Col, Badge, Card, CardBody, CardHeader } from 'reactstrap';
import { signOut } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import TrackingMap from './TrackingMap'; // Import TrackingMap component

const UserDashboard = () => {
    const [bookings, setBookings] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [isTracking, setIsTracking] = useState(false); 
    const [currentBookingId, setCurrentBookingId] = useState(null);
    const navigate = useNavigate();

    // Function to fetch bookings
    const fetchBookings = async () => {
        try {
            const userEmail = auth.currentUser?.email;
            if (!userEmail) {
                navigate('/login');
                return;
            }

            const usersCollection = collection(db, 'users');
            const userQuery = query(usersCollection, where("email", "==", userEmail));
            const userSnapshot = await getDocs(userQuery);
            
            if (!userSnapshot.empty) {
                const userData = userSnapshot.docs[0].data();
                const userBookingsCollection = collection(db, 'bookings');
                const bookingQuery = query(userBookingsCollection, where("userid", "==", userData.userid));
                const bookingSnapshot = await getDocs(bookingQuery);
                
                const userBookings = bookingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setBookings(userBookings);
            }
        } catch (error) {
            setErrorMessage("Error fetching bookings: " + error.message);
        }
    };

    useEffect(() => {
        fetchBookings(); // Call fetchBookings on component mount
    }, [navigate]);

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/login');
    };

    const handleCreateBooking = () => {
        navigate('/booking'); // Navigate to the Booking Form
    };

    const handleTrackDriver = (bookingId) => {
        console.log("Tracking driver for booking ID:", bookingId);
        setCurrentBookingId(bookingId);
        setIsTracking(true);
    };

    // Function to update driverId when booking is accepted
    const handleDriverAcceptance = async (bookingId, driverId) => {
        const bookingRef = doc(db, 'bookings', bookingId);
        await updateDoc(bookingRef, { driverId: driverId, status: 'accepted' }); // Update driverId and set status to accepted
        fetchBookings(); // Re-fetch bookings to reflect changes
    };

    // Function to get status badge color
    const getStatusColor = (status) => {
        switch (status) {
            case 'accepted':
                return 'success';
            case 'pending':
                return 'warning';
            case 'completed':
                return 'info';
            default:
                return 'secondary';
        }
    };

    // Helper function to convert tripTime to readable format (minutes)
    const formatTripTime = (tripTime) => {
        return tripTime ? `${tripTime} min` : 'N/A';
    };

    return (
        <Container>
            <Row className="mb-4">
                <Col md="8">
                    <h2 className="text-primary">User Dashboard</h2>
                    <Button color="primary" className="me-2" onClick={handleCreateBooking}>Create New Booking</Button>
                    <Button color="danger" onClick={handleLogout}>Logout</Button>
                    {errorMessage && <Alert color="danger">{errorMessage}</Alert>}
                </Col>
                <Col md="4" className="text-right">
                    <img
                        src="https://img.favpng.com/2/24/0/computer-icons-avatar-user-profile-png-favpng-HPjiNes3x112h0jw38sbfpDY9.jpg"
                        alt="User Avatar"
                        style={{ width: '150px', borderRadius: '50%' }}
                    />
                </Col>
            </Row>

            <Card>
                <CardHeader className="bg-primary text-white">
                    <h3>My Bookings</h3>
                </CardHeader>
                <CardBody>
                    <Table striped responsive>
                        <thead>
                            <tr>
                                <th>Pickup</th>
                                <th>Drop-off</th>
                                <th>Vehicle Type</th>
                                <th>Scheduled Time</th> {/* New column for Scheduled Time */}
                                <th>Trip Time</th> {/* New column for Trip Time */}
                                <th>Status</th>
                                <th>Driver ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map(booking => (
                                <tr key={booking.id}>
                                    <td>{booking.pickup}</td>
                                    <td>{booking.dropoff}</td>
                                    <td>{booking.vehicleType}</td>
                                    <td>{booking.scheduledTime || 'N/A'}</td> {/* Display scheduledTime */}
                                    <td>{formatTripTime(booking.tripTime)}</td> {/* Display formatted tripTime */}
                                    <td>
                                        <Badge color={getStatusColor(booking.status)}>
                                            {booking.status}
                                        </Badge>
                                        {booking.status === 'accepted' && (
                                            <Button color="info" className="ms-2" size="sm" onClick={() => handleTrackDriver(booking.id)}>
                                                Track Driver
                                            </Button>
                                        )}
                                    </td>
                                    <td>{booking.driverId || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </CardBody>
            </Card>

            {isTracking && (
                <>
                    <TrackingMap bookingId={currentBookingId} />
                    {console.log("TrackingMap is rendering with booking ID:", currentBookingId)}
                </>
            )}
        </Container>
    );
};

export default UserDashboard;
