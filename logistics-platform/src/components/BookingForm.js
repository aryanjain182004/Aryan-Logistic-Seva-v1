import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; // Ensure this path is correct
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import { Container, Form, FormGroup, Label, Input, Button, Alert, Card, CardBody } from 'reactstrap'; // Import Bootstrap components
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore"; // Import Firestore methods
import { v4 as uuidv4 } from 'uuid'; // Import uuid for unique bookingId
import { getDistanceBetweenLocations } from '../utils/distanceCalculator'; // Custom utility to calculate distance

const BookingForm = () => {
    const navigate = useNavigate(); // Initialize useNavigate
    const [pickup, setPickup] = useState('');
    const [dropoff, setDropoff] = useState('');
    const [vehicleType, setVehicleType] = useState('');
    const [cost, setCost] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [loading, setLoading] = useState(false); // Loading state
    const [error, setError] = useState(''); // Error state
    const [success, setSuccess] = useState(''); // Success message
    const [userId, setUserId] = useState(''); // State to store user ID
    const [tripTime, setTripTime] = useState(''); // State to store estimated trip time

    useEffect(() => {
        const fetchUserId = async () => {
            const userEmail = auth.currentUser?.email; // Get the current user's email
            if (userEmail) {
                const usersCollection = collection(db, 'users');
                const userQuery = query(usersCollection, where("email", "==", userEmail));
                const userSnapshot = await getDocs(userQuery);

                if (!userSnapshot.empty) {
                    const userData = userSnapshot.docs[0].data();
                    setUserId(userData.userid); // Set user ID state
                } else {
                    setError("User not found in Firestore.");
                }
            } else {
                setError("User not logged in.");
            }
        };

        fetchUserId();
    }, []);

    const calculateCostAndTime = async () => {
        const distance = await getDistanceBetweenLocations(pickup, dropoff);

        if (distance === null) {
            setError('Could not calculate distance between locations.');
            return 0;
        }

        const rates = {
            car: 30,
            van: 50,
            truck: 80
        };

        const demandMultiplier = 1.2;

        const baseCost = distance * (rates[vehicleType.toLowerCase()] || rates['car']);
        const finalCost = baseCost * demandMultiplier;

        setCost(finalCost.toFixed(2));

        // Calculate estimated trip time (in minutes)
        const averageSpeed = 50; // Average speed in km/h
        const timeInHours = distance / averageSpeed;
        const estimatedTimeInMinutes = timeInHours * 60;

        setTripTime(Math.round(estimatedTimeInMinutes)); // Store estimated trip time
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!pickup || !dropoff || !vehicleType || !scheduledTime) {
            setError('Please fill in all fields');
            return;
        }

        if (!userId) {
            setError('User not logged in. Please log in to create a booking.');
            return;
        }

        const bookingId = uuidv4();

        const booking = {
            bookingId,
            userid: userId,
            pickup,
            dropoff,
            vehicleType,
            cost,
            scheduledTime,
            driverId: '', // Initially empty driverId
            status: 'pending', // Set initial status to pending
            tripTime // Add estimated trip time to the booking
        };

        setLoading(true);

        try {
            await setDoc(doc(db, 'bookings', bookingId), booking);
            setSuccess('Booking created successfully!');
            setPickup('');
            setDropoff('');
            setVehicleType('');
            setScheduledTime('');
            setCost('');
            setTripTime(''); // Reset trip time
        } catch (error) {
            console.error("Error adding document: ", error);
            setError('Error creating booking: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCalculateClick = async () => {
        if (!pickup || !dropoff || !vehicleType) {
            setError('Please fill in pickup, drop-off, and vehicle type before estimating cost.');
        } else {
            await calculateCostAndTime();
        }
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard'); // Navigate back to the user dashboard
    };

    return (
        <Container className="my-5">
            <Card className="p-4 shadow-sm border-0" style={{ borderRadius: '15px' }}>
                <CardBody>
                    <h2 className="text-center mb-4" style={{ color: '#007bff' }}>Create a Booking</h2>
                    <Form onSubmit={handleSubmit}>
                        <FormGroup>
                            <Label for="pickup" style={{ fontWeight: 'bold' }}>Pickup Location</Label>
                            <Input type="text" id="pickup" value={pickup} onChange={(e) => setPickup(e.target.value)} required />
                        </FormGroup>
                        <FormGroup>
                            <Label for="dropoff" style={{ fontWeight: 'bold' }}>Drop-off Location</Label>
                            <Input type="text" id="dropoff" value={dropoff} onChange={(e) => setDropoff(e.target.value)} required />
                        </FormGroup>
                        <FormGroup>
                            <Label for="vehicleType" style={{ fontWeight: 'bold' }}>Vehicle Type</Label>
                            <Input type="select" id="vehicleType" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} required>
                                <option value="">Select a vehicle</option>
                                <option value="car">Car</option>
                                <option value="van">Van</option>
                                <option value="truck">Truck</option>
                            </Input>
                        </FormGroup>
                        <Button color="info" type="button" onClick={handleCalculateClick} disabled={loading} className="mb-3">
                            {loading ? 'Calculating...' : 'Estimate Cost and Time'}
                        </Button>
                        <FormGroup>
                            <Label for="cost" style={{ fontWeight: 'bold' }}>Estimated Cost</Label>
                            <Input type="text" id="cost" value={cost} readOnly />
                        </FormGroup>
                        <FormGroup>
                            <Label for="tripTime" style={{ fontWeight: 'bold' }}>Estimated Trip Time (minutes)</Label>
                            <Input type="text" id="tripTime" value={tripTime} readOnly />
                        </FormGroup>
                        <FormGroup>
                            <Label for="scheduledTime" style={{ fontWeight: 'bold' }}>Scheduled Time</Label>
                            <Input type="datetime-local" id="scheduledTime" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} required />
                        </FormGroup>
                        <Button color="primary" type="submit" disabled={loading} className="mb-2">
                            {loading ? 'Submitting...' : 'Submit Booking'}
                        </Button>
                        <Button color="secondary" type="button" onClick={handleBackToDashboard} className="ml-2">
                            Back to Dashboard
                        </Button>
                    </Form>
                    {error && <Alert color="danger" className="mt-3">{error}</Alert>} {/* Error message */}
                    {success && <Alert color="success" className="mt-3">{success}</Alert>} {/* Success message */}
                </CardBody>
            </Card>
        </Container>
    );
};

export default BookingForm;
