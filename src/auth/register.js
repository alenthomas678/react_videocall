import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function Register(props) {

    const [Email, setEmail] = useState("");
    const [Name, setName] = useState("");
    const [Password, setPassword] = useState("");
    const [ConfirmPassword, setConfirmPassword] = useState("");

    const onEmailHandler = (event) => {
        setEmail(event.currentTarget.value);
    }

    const onNameHandler = (event) => {
        setName(event.currentTarget.value);
    }

    const onPasswordHandler = (event) => {
        setPassword(event.currentTarget.value);
    }

    const onConfirmPasswordHandler = (event) => {
        setConfirmPassword(event.currentTarget.value);
    }

    const onSubmitHandler = (event) => {
        event.preventDefault();

        if (Password !== ConfirmPassword) {
            return alert("ERROR: Password and Confirm password does NOT match.")
        }

        axios.post('http://localhost:8080/auth/signup', {
            name: Name,
            email: Email,
            password: Password
        })
            .then(res => {
                toast.success("Registered successfully");
                props.history.push('/login');
            })
            .catch(err => {
                toast.error("Some error occurred!");
            })
    }

    return (
        <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100vh'
        }}>
            <form style={{ display: 'flex', flexDirection: 'column' }}
                onSubmit={onSubmitHandler}
            >
                <label>Email</label>
                <input type="email" value={Email} onChange={onEmailHandler} />
                <label>Name</label>
                <input type="text" value={Name} onChange={onNameHandler} />
                <label>Password</label>
                <input type="password" value={Password} onChange={onPasswordHandler} />
                <label>Confirm Password</label>
                <input type="password" value={ConfirmPassword} onChange={onConfirmPasswordHandler} />
                <br />
                <button type="submit">
                    Sign Up
                </button>
            </form>
            <br /><br />
            <a href="#" onClick={() => {
                window.location.href = 'login';
            }}>Login</a>
        </div>
    )
}

export default Register;