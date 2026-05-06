# Backend API Documentation

**Project:** Sistem Pendukung Keputusan (SPK) Penentuan Status Gizi Balita - Fuzzy Mamdani
**Base URL:** `http://localhost:5000/api`
**Format:** `application/json`

---

## Table of Contents
1. [Authentication](#1-authentication)
2. [Balita (Toddler) Management](#2-balita-toddler-management)
3. [Pemeriksaan (Examinations & Fuzzy SPK)](#3-pemeriksaan-examinations--fuzzy-spk)
4. [Error Responses](#4-error-responses)
5. [Roles and Permissions](#5-roles-and-permissions)

---

## 1. Authentication

Endpoints for user registration, login, and profile retrieval.

### Login
*   **URL:** `/auth/login`
*   **Method:** `POST`
*   **Body:**
    ```json
    {
      "username": "admin",
      "password": "adminpassword"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "token": "eyJhbGciOiJIUzI1Ni...",
      "user": {
        "id": 1,
        "nama": "Administrator",
        "username": "admin",
        "role": "admin"
      }
    }
    ```

### Get Current Profile
*   **URL:** `/auth/me`
*   **Method:** `GET`
*   **Headers:** `Authorization: Bearer <token>`
*   **Success Response (200 OK):**
    ```json
    {
      "id": 1,
      "nama": "Administrator",
      "username": "admin",
      "role": "admin",
      "status_aktif": true
    }
    ```

### User Management (Admin Only)

#### Get All Users
*   **URL:** `/auth/users`
*   **Method:** `GET`
*   **Headers:** `Authorization: Bearer <token>`

#### Register New User
*   **URL:** `/auth/register`
*   **Method:** `POST`
*   **Body:** `{ "nama": "...", "username": "...", "password": "...", "role": "..." }`

#### Update User
*   **URL:** `/auth/users/:id`
*   **Method:** `PUT`
*   **Body:** `{ "nama": "...", "username": "...", "role": "...", "status_aktif": true, "password": "..." (optional) }`

#### Delete User
*   **URL:** `/auth/users/:id`
*   **Method:** `DELETE`

---

## 2. Balita (Toddler) Management

Manage the profiles of toddlers in the Posyandu.

### Get All Balita
*   **URL:** `/balita`
*   **Method:** `GET`
*   **Headers:** `Authorization: Bearer <token>`
*   **Query Params (Optional):** `search` (filter by name)
*   **Success Response (200 OK):**
    ```json
    [
      {
        "id": 1,
        "nama": "Ananda Pratama",
        "jenis_kelamin": "L",
        "tanggal_lahir": "2022-05-20",
        "nama_orang_tua": "Siti Aminah",
        "alamat": "Jl. Mawar No. 5",
        "kontak": "08123456789"
      }
    ]
    ```

### Create Balita
*   **URL:** `/balita`
*   **Method:** `POST`
*   **Headers:** `Authorization: Bearer <token>`
*   **Body:**
    ```json
    {
      "nama": "Budi Santoso",
      "jenis_kelamin": "L",
      "tanggal_lahir": "2023-01-10",
      "nama_orang_tua": "Heri",
      "alamat": "Dusun A",
      "kontak": "085..."
    }
    ```

### Update Balita
*   **URL:** `/balita/:id`
*   **Method:** `PUT`
*   **Headers:** `Authorization: Bearer <token>`
*   **Body:** (Any fields to update)

### Delete Balita
*   **URL:** `/balita/:id`
*   **Method:** `DELETE`
*   **Headers:** `Authorization: Bearer <token>`
*   **Note:** Restricted to `admin` role.

---

## 3. Pemeriksaan (Examinations & Fuzzy SPK)

The core functionality where measurements are processed by the Fuzzy Mamdani engine.

### Submit Examination (Calculate SPK)
*   **URL:** `/pemeriksaan`
*   **Method:** `POST`
*   **Headers:** `Authorization: Bearer <token>`
*   **Body:**
    ```json
    {
      "balita_id": 1,
      "berat_badan": 12.5,
      "tinggi_badan": 85.0,
      "umur_bulan": 24,
      "tanggal_pemeriksaan": "2026-05-06",
      "catatan": "Anak aktif"
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
      "message": "Pemeriksaan saved successfully",
      "data": {
        "id": 1,
        "balita_id": 1,
        "berat_badan": 12.5,
        "tinggi_badan": 85,
        "umur_bulan": 24,
        "hasil_fuzzy": 75.4,
        "kategori_gizi": "Gizi Baik",
        "petugas_id": 1
      },
      "fuzzy_details": {
        "fuzzification": { ... },
        "aggregation": { "buruk": 0, "kurang": 0.2, "baik": 0.8, "lebih": 0 }
      }
    }
    ```

### Get Examination History for a Balita
*   **URL:** `/pemeriksaan/balita/:balitaId`
*   **Method:** `GET`
*   **Headers:** `Authorization: Bearer <token>`

---

## 4. Error Responses

Common error codes returned by the API:

| Code | Message | Description |
| :--- | :--- | :--- |
| 400 | Validation error | Missing required fields or invalid data formats. |
| 401 | No token / Token invalid | Authentication failed or token expired. |
| 403 | Access denied | User does not have the required role (e.g., non-admin trying to delete). |
| 404 | Not found | Resource (Balita, User, or Pemeriksaan) does not exist. |
| 500 | Server error | Internal database or logic error. |

---

## 5. Roles and Permissions

*   **Admin**: Full access. Can create/edit/delete all data, including users.
*   **Kader**: Can create/edit Balita and Pemeriksaan. Cannot delete.
*   **Petugas**: Can view all data and create reports.

---

## Developer Notes (Frontend Integration)
1. **JWT Handling**: Store the token in `localStorage` or `sessionStorage` and include it in the `Authorization` header as `Bearer <token>` for every subsequent request.
2. **Fuzzy Logic**: The calculation is performed on the server. You only need to send the raw measurements (BB, TB, Age) to the `/pemeriksaan` endpoint to get the status result.
3. **Date Formats**: Use `YYYY-MM-DD` for all date fields to ensure compatibility with SQLite.
