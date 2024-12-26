import React from 'react'
import { Link } from 'react-router-dom'

const NotFoundPage = () => {
    return (
        <div class="main_container">
            <div class="not_found_container">
                <h1>404</h1>
                <p>Oops! The page you're looking for doesn't exist.</p>
                <Link to="/">Go back to the homepage</Link>
            </div>
        </div>
    )
}

export default NotFoundPage
