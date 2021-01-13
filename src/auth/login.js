import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { v1 as uuid } from "uuid";

function Login(props) {

    const [Email, setEmail] = useState("")
    const [Password, setPassword] = useState("")
    const [Room, setRoom] = useState("")

    const onEmailHandler = (event) => {
        setEmail(event.currentTarget.value)
    }

    const onPasswordHandler = (event) => {
        setPassword(event.currentTarget.value)
    }

    const onRoomHandler = (event) => {
        setRoom(event.currentTarget.value)
    }

    const onSubmitHandler = (event) => {
        event.preventDefault();
        props.history.push(`/room/${Room}/${Email}`);

        // axios.post('http://localhost:5000/auth/login', {
        //     email: Email,
        //     password: Password
        // })
        //     .then(res => {
        //         toast.success("Login success");
        //         localStorage.setItem('auth', JSON.stringify(res.data.token));
        //         localStorage.setItem('name', JSON.stringify(res.data.name));
        //         props.history.push(`/room/${Room}/${Email}`);
        //         // props.history.push('/home');
        //     }).catch(err => {
        //         toast.error("Some error occurred!");
        //     })
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
                <label>Password</label>
                <input type="password" value={Password} onChange={onPasswordHandler} />
                <br />
                <label>Room name</label>
                <input type="room" value={Room} onChange={onRoomHandler} />
                <br />
                <button type="submit">
                    Login
                </button>
            </form>
        </div>
    )
}

export default Login;