// 1. НАСТРОЙКА FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyBFLiYhBJ0E4FoibirpFlKd5VYchWIS44U",
    authDomain: "inearth-map.firebaseapp.com",
    projectId: "inearth-map",
    storageBucket: "inearth-map.firebasestorage.app",
    messagingSenderId: "899743733538",
    appId: "1:899743733538:web:a5e07f7a1c9aee3c26377b"
  };
  
  // Инициализация
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  
  // 2. ИНИЦИАЛИЗАЦИЯ КАРТЫ
  const map = L.map('map', {
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 10, // Важный параметр для работы кластеров
      zoomControl: false, 
      maxBounds: [[-90, -180], [90, 180]]
  });
  
  // Загружаем слой "земли" (GeoJSON)
  fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
      .then(res => res.json())
      .then(data => {
          L.geoJSON(data, {
              style: {
                  fillColor: '#284d9e', // Суша
                  weight: 1,
                  opacity: 1,
                  color: '#4a6cb3',     // Границы
                  fillOpacity: 1
              }
          }).addTo(map);
      });
  
  // Группа для кластеров
  const markers = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 60,
      disableClusteringAtZoom: 8
  });
  map.addLayer(markers);
  
  // 3. ИНТЕРФЕЙС
  const usernameInput = document.getElementById('usernameInput');
  const okBtn = document.getElementById('okBtn');
  const inputGroup = document.querySelector('.input-group');
  const currentUserDisplay = document.getElementById('currentUserDisplay');
  const myAvatar = document.getElementById('myAvatar');
  const myHandle = document.getElementById('myHandle');
  
  let currentUsername = null;
  
  // 4. ЛОГИКА ВВОДА НИКНЕЙМА
  okBtn.addEventListener('click', () => {
      const val = usernameInput.value.trim().replace('@', '');
      if (val.length < 2) {
          alert("Введите никнейм!");
          return;
      }
      
      currentUsername = val;
      const avatarUrl = `https://unavatar.io/twitter/${currentUsername}`;
  
      inputGroup.classList.add('hidden');
      currentUserDisplay.classList.remove('hidden');
      
      myAvatar.src = avatarUrl;
      // Заглушка, если аватарка не грузится
      myAvatar.onerror = function() {
          this.src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
      };
      
      myHandle.innerText = '@' + currentUsername;
      
      alert("Готово! Теперь кликните на карту.");
  });
  
  // 5. ЛОГИКА КЛИКА ПО КАРТЕ
  map.on('click', async (e) => {
      if (!currentUsername) {
          alert("Сначала введите ваш никнейм вверху!");
          return;
      }
  
      const { lat, lng } = e.latlng;
      
      if (confirm(`Закрепить место за @${currentUsername}?`)) {
          try {
              await db.collection('users').doc(currentUsername.toLowerCase()).set({
                  handle: currentUsername,
                  photoURL: `https://unavatar.io/twitter/${currentUsername}`,
                  lat: lat,
                  lng: lng,
                  timestamp: firebase.firestore.FieldValue.serverTimestamp()
              });
              alert("Успешно! Ваша точка сохранена.");
          } catch (error) {
              console.error("Ошибка Firebase:", error);
              alert("Ошибка: " + error.message);
          }
      }
  });
  
  // 6. ПОЛУЧЕНИЕ ДАННЫХ (СЛУШАЕМ БАЗУ)
  db.collection('users').onSnapshot((snapshot) => {
      markers.clearLayers(); // Очищаем карту перед обновлением
      
      snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.lat && data.lng) {
              const safeImg = `<img src="${data.photoURL}" class="custom-avatar-icon" width="40" height="40" onerror="this.src='https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'">`;
  
              const icon = L.divIcon({
                  className: 'custom-avatar-container',
                  html: safeImg,
                  iconSize: [40, 40],
                  iconAnchor: [20, 20]
              });
  
              const marker = L.marker([data.lat, data.lng], { icon: icon });
              marker.bindPopup(`<b>@${data.handle}</b>`);
              markers.addLayer(marker);
          }
      });
  });
  