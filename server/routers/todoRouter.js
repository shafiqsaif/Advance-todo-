import { pool } from '../helpers/db.js';
import { Router } from  "express";
import { emptyOrRows } from "../helpers/utils.js";
import { compare } from 'bcrypt';
import { auth } from '../helpers/auth.js'
// import { sign } from 'jsonwebtoken';

const router = Router();

router.get('/',(req,res,next) => {
    pool.query('select * from task', (error, result) => {
        if  (error) {
            // return res.status(500).json({error: error.message})
            return next (error)
        }
        return res.status(200).json(emptyOrRows(result))
    })
})

router.post('/create',auth, (req, res, next) => {
    pool.query('INSERT INTO task (description) VALUES ($1) RETURNING *',
        [req.body.description],
        (error, result) => {
            if (error) {
                // return res.status(500).json({ error: error.message });
                return next (error)
            }
            return res.status(200).json({ id: result.rows[0].id});
});
});

router.delete('/delete/:id',auth, (req, res,next) => {
    const id = parseInt(req.params.id);
    pool.query('DELETE FROM task WHERE id = $1', 
        [id], 
        (error, result) => {
        if (error) {
            // return res.status(500).json({ error: error.message });
            return next (error)
        }

    
            return res.status(200).json({ id: id });
        });
    });

router.post('/login',(req,res,next) => {
    const invalid_message = 'Invalid credentials.'
    try{
        pool.query('select * from account where email=$1',
            [req.body.email],
            (error,result) => {
                if (error) return res.status(401).json({ error: invalid_message });//next (error)
                if (result.rowCount === 0 ) return  next (new Error(invalid_message))
                    compare(req.body.password,result.rows[0].password,(error,match) => {
                if (error) return res.status(401).json({ error: invalid_message });//next (error)
                if (!match) return next (new Error(invalid_message))
                const token = sign({user: req.body.email}, process.env.JWT_SECRET_KEY)
                const user = result.rows[0]
                return res.status(200).json(
                    {
                        'id':user.id,
                        'email':user.email,
                        'token': token

                    }
                )
                })
            }
        )
    } catch (error) {
        return next (error)
    }
})


export default router;











// router.delete('/delete/:id', (req, res, next) => {
//     const id = req.params.id;
    
//     // Validate that 'id' is numeric to avoid SQL injection
//     if (isNaN(id)) {
//         return res.status(400).json({ error: 'Invalid ID format' });
//     }

//     const parsedId = parseInt(id);

//     // First, check if the task exists before attempting to delete it
//     pool.query('SELECT * FROM task WHERE id = $1', [parsedId], (error, result) => {
//         if (error) {
//             return next(error);  // Pass the error to the error handler
//         }

//         if (result.rowCount === 0) {
//             return res.status(404).json({ error: 'Task not found' });
//         }

//         // If the task exists, proceed with deletion
//         pool.query('DELETE FROM task WHERE id = $1', [parsedId], (error, result) => {
//             if (error) {
//                 return next(error);
//             }
//             return res.status(200).json({ id: parsedId });
//         });
//     });