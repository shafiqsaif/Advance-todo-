/*import { pool } from '../helpers/db.js'
import { Router } from 'express'
import { hash, compare} from 'bcrypt'
import jwt from 'jsonwebtoken'
const { sign } = jwt

const router = Router()

router.post('/register', (req,res,next) => {
    hash(req.body.password,10,(error, hashedPassword) => {
        if (error) return next(error) // Hash error
        try {
            pool.query('insert into account (email,password) values ($1,$2) returning *',
                [req.body.email,hashedPassword],
                (error,result) => {
                    if (error) return next(error) //Database error
                    return res.status(201).json({id: result.rows[0].id,email: result.rows[0].email})
                }
            )
        }catch (error) {
            return next(error)
        }
    })
})

export default router;*/



import { pool } from '../helpers/db.js';
import { Router } from 'express';
import { hash, compare } from 'bcrypt';
import jwt from 'jsonwebtoken';
const { sign } = jwt;

const router = Router();

// Register route
router.post('/register', (req, res, next) => {
    hash(req.body.password, 10, (error, hashedPassword) => {
        if (error) return next(error);  // Hash error
        try {
            pool.query(
                'INSERT INTO account (email, password) VALUES ($1, $2) RETURNING *',
                [req.body.email, hashedPassword],
                (error, result) => {
                    if (error) return next(error);  // Database error
                    return res.status(201).json({ id: result.rows[0].id, email: result.rows[0].email });
                }
            );
        } catch (error) {
            return next(error);
        }
    });
});

// Login route with detailed logging
router.post('/login', (req, res, next) => {
    const invalid_message = 'Invalid credentials.';
    console.log('Login attempt:', req.body);  // Log login attempt
    try {
        pool.query('SELECT * FROM account WHERE email = $1', [req.body.email], async (error, result) => {
            if (error) {
                console.error('Database error:', error);  // Log the error
                return res.status(401).json({ error: invalid_message });
            }
            if (result.rowCount === 0) {
                console.error('User not found for email:', req.body.email);
                return next(new Error(invalid_message));
            }
            
            compare(req.body.password, result.rows[0].password, (error, match) => {
                if (error) {
                    console.error('Password comparison error:', error);  // Log the error
                    return res.status(401).json({ error: invalid_message });
                }
                if (!match) {
                    console.error('Password does not match for email:', req.body.email);
                    return next(new Error(invalid_message));
                }

                const token = sign({ user: req.body.email }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
                const user = result.rows[0];
                console.log('Login successful for email:', req.body.email);  // Log successful login
                return res.status(200).json({ id: user.id, email: user.email, token });
            });
        });
    } catch (error) {
        console.error('Error logging in:', error);  // Log the error
        return next(error);
    }
});

export default router;
