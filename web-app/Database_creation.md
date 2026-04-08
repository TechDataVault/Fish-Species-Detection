
# 📘 PostgreSQL Complete Database Documentation (Updated)

## 1. Introduction
This document contains:
- Database setup
- Table structures (from actual system)
- Insert commands
- Image insertion process
- Best practices

---

## 2. Access PostgreSQL

```bash
psql -U postgres
```

---

## 3. List Databases

```sql
\l
```

### Databases:
- image_dataset

---

## 4. Connect to Database

```sql
\c image_dataset
```

---

## 5. List Tables

```sql
\dt
```

---

# 📊 6. TABLE CREATION SCRIPTS

## 6.1 email_otp_verification

```sql
CREATE TABLE email_otp_verification (
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6),
    expires_at TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    purpose VARCHAR(30) NOT NULL,
    PRIMARY KEY (email, purpose),
    UNIQUE (email, purpose),
    CHECK (purpose IN ('signup','forgot_password'))
);
```

---

## 6.2 new_species_data

```sql
CREATE TABLE new_species_data (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    species_photo BYTEA NOT NULL,
    sender_details JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6.3 species_images

```sql
CREATE TABLE species_images (
    id SERIAL PRIMARY KEY,
    species_name TEXT NOT NULL,
    author_name TEXT,
    family TEXT,
    common_names TEXT,
    major_identifying_features TEXT,
    image_data BYTEA
);
```

---

## 6.4 species_of_the_day

```sql
CREATE TABLE species_of_the_day (
    id SERIAL PRIMARY KEY,
    species_name TEXT NOT NULL,
    author_name TEXT,
    family TEXT,
    common_names TEXT,
    major_identifying_features TEXT,
    image_data BYTEA
);
```

---

## 6.5 users

```sql
CREATE TABLE users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    user_type VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    jwt_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    otp_code VARCHAR(10),
    otp_expires_at TIMESTAMP,
    verified_at TIMESTAMP
);
```

---

# 📥 7. INSERT COMMANDS

## 📌 IMPORTANT: Image Storage Setup

Before inserting images into PostgreSQL:

1. Create a folder in your system:
```
D:/CMFRI/application/search-database/
```

2. Place all species images inside this folder.

3. Ensure:
- PostgreSQL has access to this path
- Use **forward slashes ( / )**
- File name must match exactly

---

## 7.1 Insert into species_images (with image)

```sql
INSERT INTO species_images (
    species_name,
    author_name,
    family,
    common_names,
    major_identifying_features,
    image_data
)
VALUES (
    'Alepes kleinii',
    '(Bloch 1793)',
    'Carangidae',
    'Razorbelly scad',
    'Body fusiform, silvery, yellow caudal fin',
    pg_read_binary_file('D:/CMFRI/application/search-database/Alepes kleinii.jpg')
);
```

---

## 7.2 Insert into users

```sql
INSERT INTO users (name, mobile, email, user_type, password)
VALUES ('Shantha', '9876543210', 'shantha@test.com', 'admin', 'hashed_password');
```

---

## 7.3 Insert OTP

```sql
INSERT INTO email_otp_verification (email, otp, expires_at, purpose)
VALUES ('test@mail.com', '123456', NOW() + INTERVAL '5 minutes', 'signup');
```

---

# 🔍 8. VERIFICATION COMMANDS

```sql
SELECT * FROM users;
SELECT * FROM species_images;
```

---

# ⚠️ 9. IMPORTANT NOTES

- Image path must be accessible to PostgreSQL server
- Always use forward slash `/`
- Large images will increase DB size

---

