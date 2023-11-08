import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import sqlite3 from 'sqlite3';

const app: Application = express();
// app.use(cores());
const corsOptions = {
  origin: true,
  credentials: true,
};
app.use('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//DB connection
const database = 'dua_main.sqlite';

const connectDB = new sqlite3.Database(database, err => {
  if (err) {
    console.log(err);
  } else {
    console.log('DB connected');
  }
});

app.get('/category', async (req: Request, res: Response) => {
  const search = req.query.search || '';
  const searchParam = `%${search}%`;
  const query = `SELECT * FROM category WHERE cat_name_en LIKE ?`;
  try {
    const data = await new Promise((resolve, reject) => {
      connectDB.all(query, [searchParam], (error, rows) => {
        if (error) {
          reject('Database error');
        } else {
          resolve(rows);
        }
      });
    });
    res.status(StatusCodes.OK).json({
      message: 'Data fetched successfully',
      data,
    });
  } catch (error: any) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error?.message });
  }
});

app.get('/duas/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const sqlQuery = `
  SELECT sct.*, dua.*
  FROM sub_category AS sct
  LEFT JOIN dua ON sct.subcat_id = dua.subcat_id
  WHERE sct.cat_id = ${id}`;
  try {
    const data: any = await new Promise((resolve, reject) => {
      connectDB.all(sqlQuery, (error, rows) => {
        if (error) {
          console.log(error);
          reject('Database error');
        } else {
          resolve(rows);
        }
      });
    });

    const result = data.reduce((acc: any, current: any) => {
      const { subcat_id, subcat_name_en, ...dua } = current;
      let el = acc.find(
        (item: any) =>
          item.subcat_id === subcat_id &&
          subcat_name_en === current.subcat_name_en
      );
      if (!el) {
        el = { subcat_id, subcat_name_en, dua_list: [] };
        acc.push(el);
      }
      el.dua_list.push({ ...dua, subcat_id });
      return acc;
    }, []);
    res.status(StatusCodes.OK).json({
      message: 'Data fetched successfully',
      data: result,
    });
  } catch (error: any) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error?.message });
  }
});

app.get('', (req, res) => {
  const message = `Server is running `;
  res.status(StatusCodes.OK).json({
    message,
  });
});

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: 'Not found',
    errorMessages: [
      {
        path: req.originalUrl,
        message: 'API not found',
      },
    ],
  });
  next();
});

export default app;
