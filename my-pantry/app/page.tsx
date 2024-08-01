'use client';

import React, { useEffect, useState } from 'react';
import { Box, Stack, Typography, Button, TextField, IconButton, Tabs, Tab, Grid } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc, query, where, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../app/firebase';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';
import axios from 'axios';


const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};


export default function Pantry() {
  const [items, setItems] = useState<{ id: string; name: string; quantity: number; expirationDate: string }[]>([]);
  const [newItem, setNewItem] = useState<string>('');
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [recipe, setRecipe] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'pantryItems'), (snapshot) => {
      const itemsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        quantity: doc.data().quantity,
        expirationDate: doc.data().expirationDate,
      }));
      setItems(itemsList);
    });

    return () => unsubscribe();
  }, []);

  const addItemToFirestore = async () => {
    if (newItem.trim() !== '' && expirationDate) {
      const q = query(collection(db, 'pantryItems'), where('name', '==', newItem));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await addDoc(collection(db, 'pantryItems'), { name: newItem, quantity: 1, expirationDate: expirationDate.toISOString() });
      } else {
        querySnapshot.forEach(async (document) => {
          const itemRef = doc(db, 'pantryItems', document.id);
          await updateDoc(itemRef, { quantity: document.data().quantity + 1 });
        });
      }

      setNewItem('');
      setExpirationDate(null);
    }
  };

  const removeItemFromFirestore = async (id: string) => {
    const itemRef = doc(db, 'pantryItems', id);
    const itemDoc = await getDoc(itemRef);

    if (itemDoc.exists()) {
      const currentQuantity = itemDoc.data().quantity;

      if (currentQuantity > 1) {
        await updateDoc(itemRef, { quantity: currentQuantity - 1 });
      } else {
        await deleteDoc(itemRef);
      }
    }
  };

  const fetchRecipeSuggestions = async (
    availableItems: { id: string; name: string; quantity: number; expirationDate: string }[],
    soonToExpireItems: { id: string; name: string; quantity: number; expirationDate: string }[],
    setRecipe: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const ingredients = [...availableItems, ...soonToExpireItems].map(item => item.name).join(', ');
  
    try {
      const response = await axios.post('http://127.0.0.1:5001/generate_recipe', { ingredients });
      setRecipe(response.data.recipe);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching recipe suggestions:', error.response ? error.response.data : error.message);
        setRecipe('Error fetching recipe suggestions. Please try again later.');
      } else {
        console.error('An unexpected error occurred:', error);
        setRecipe('An unexpected error occurred. Please try again later.');
      }
    }
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const soonToExpireItems = filteredItems.filter((item) => {
    const daysUntilExpiration = dayjs(item.expirationDate).diff(dayjs(), 'day');
    return daysUntilExpiration <= 7 && daysUntilExpiration > 0;
  });

  const expiredItems = filteredItems.filter((item) => {
    const daysUntilExpiration = dayjs(item.expirationDate).diff(dayjs(), 'day');
    return daysUntilExpiration <= 0;
  });

  const availableItems = filteredItems.filter((item) => !soonToExpireItems.includes(item) && !expiredItems.includes(item));

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box display="flex" width="100vw" height="100vh">
        <Box className="image-container" />
        <Box className="content-container" sx={{ overflowY: 'auto' }}>
          <Stack
            width="100%"
            spacing={2}
            alignItems="center"
            textAlign="center"
            sx={{ marginBottom: '20px', border: '2px solid black', padding: '10px' }}
          >
            <Typography
              variant="h5"
              component="h2"
              sx={{ borderBottom: '2px solid black', paddingBottom: '10px', width: '100%' }}
            >
              Add Pantry Item
            </Typography>
            <TextField
              label="Add Pantry Item"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              variant="outlined"
              fullWidth
              sx={{ marginBottom: '10px' }}
            />
            <DatePicker
              label="Expiration Date"
              value={expirationDate}
              onChange={(newValue) => setExpirationDate(newValue)}
              slotProps={{ textField: { variant: "outlined", fullWidth: true, sx: { marginBottom: '10px' } } }}
            />
            <Button variant="contained" color="primary" onClick={addItemToFirestore}>
              Add Item
            </Button>
          </Stack>
          <Stack
            width="100%"
            height="500px"
            spacing={2}
            alignItems="center"
            textAlign="center"
            sx={{ border: '2px solid black', padding: '10px' }}
          >
            <Typography
              variant="h4"
              component="h1"
              sx={{ borderBottom: '2px solid black', paddingBottom: '10px', width: '100%' }}
            >
              Pantry Management
            </Typography>
            <TextField
              label="Search Pantry Items"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="outlined"
              fullWidth
              sx={{ marginBottom: '10px' }}
            />
            <Tabs value={tabIndex} onChange={(e, newValue) => setTabIndex(newValue)}>
              <Tab label="Available Items" />
              <Tab label="Soon to Expire" />
              <Tab label="Expired Items" />
            </Tabs>
            <Box sx={{ overflowY: 'auto', width: '100%' }}>
              {tabIndex === 0 && (
                <>
                  {availableItems.length === 0 ? (
                    <Typography variant="h6">No items available</Typography>
                  ) : (
                    availableItems.map((item) => (
                      <Box
                        key={item.id}
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ border: '1px solid black', padding: '5px', marginTop: '5px' }}
                      >
                        <Typography variant="h6" sx={{ color: expiredItems.includes(item) ? 'red' : soonToExpireItems.includes(item) ? 'orange' : 'black' }}>
                          {capitalizeFirstLetter(item.name)} - {item.quantity} {expiredItems.includes(item) ? '(Expired)' : soonToExpireItems.includes(item) ? `(Expires: ${dayjs(item.expirationDate).format('YYYY-MM-DD')})` : ''}
                        </Typography>
                        <IconButton onClick={() => removeItemFromFirestore(item.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))
                  )}
                </>
              )}
              {tabIndex === 1 && (
                <>
                  {soonToExpireItems.length === 0 ? (
                    <Typography variant="h6">No items expiring soon</Typography>
                  ) : (
                    soonToExpireItems.map((item) => (
                      <Box
                        key={item.id}
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ border: '1px solid red', padding: '5px', marginTop: '5px' }}
                      >
                        <Typography variant="h6">
                          {capitalizeFirstLetter(item.name)} - {item.quantity} (Expires: {dayjs(item.expirationDate).format('YYYY-MM-DD')})
                        </Typography>
                        <IconButton onClick={() => removeItemFromFirestore(item.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))
                  )}
                </>
              )}
              {tabIndex === 2 && (
                <>
                  {expiredItems.length === 0 ? (
                    <Typography variant="h6">No expired items</Typography>
                  ) : (
                    expiredItems.map((item) => (
                      <Box
                        key={item.id}
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ border: '1px solid black', padding: '5px', marginTop: '5px' }}
                      >
                        <Typography variant="h6">
                          {capitalizeFirstLetter(item.name)} - {item.quantity} (Expired: {dayjs(item.expirationDate).format('YYYY-MM-DD')})
                        </Typography>
                        <IconButton onClick={() => removeItemFromFirestore(item.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))
                  )}
                </>
              )}
            </Box>
            <Button variant="contained" color="secondary" onClick={() => fetchRecipeSuggestions(availableItems, soonToExpireItems, setRecipe)}>
              Get Recipe Suggestions
            </Button>
          </Stack>
          {recipe && (
            <Box
              width="751px"
              sx={{ marginBottom: '20px', padding: '10px', border: '1px solid black', borderRadius: '4px' }}
            >
              <Typography variant="h6">Recipe Suggestions</Typography>
              <Typography variant="body1">{recipe}</Typography>
            </Box>
          )}
        </Box>
        </Box>
      </LocalizationProvider>
  );
}