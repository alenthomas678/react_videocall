import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const Home = (props) => {
    const [json,setJson] = useState([]);
    const textRef = useRef();

    useEffect(() => {
        axios.get('http://localhost:8080/auth/home', {
            headers: {'Authorization': `Bearer ${JSON.parse(localStorage.getItem('auth'))}`}
        }).then(res => {
            setJson(res.data.name);
        }).catch(err => {
            console.log('Error');
        })
    },[]);

    return (
        <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100vh'
        }}>
            <p>{JSON.stringify(json)}</p>
            <textarea ref={textRef}></textarea>
           
            <button onClick = {() => {
                localStorage.clear();
                props.history.push('/login');
            }}>Logout</button>
        </div>
    )
}

export default Home;