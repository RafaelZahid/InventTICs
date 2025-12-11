
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Movements from './components/Movements';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Scanner from './components/Scanner';
import Chatbot from './components/Chatbot';
import Login from './components/Login';
import Register from './components/Register';
import RegisterMovementModal from './components/RegisterMovementModal';
import { View, User, Product, Movement } from './types';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { collection, doc, setDoc, addDoc, updateDoc, deleteDoc, writeBatch, query, orderBy, getDoc, onSnapshot } from 'firebase/firestore';

const App: React.FC = () => {
  // --- ESTADOS DE AUTENTICACIÓN Y USUARIOS ---
  const [authStatus, setAuthStatus] = useState<'loading' | 'login' | 'register' | 'loggedIn'>('loading');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // --- ESTADO DE NAVEGACIÓN Y DATOS ---
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Nuevo estado para menú móvil
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(50);
  const [movementModal, setMovementModal] = useState<{ isOpen: boolean; initialProductId?: string }>({ isOpen: false });

  // Efecto para manejar el estado de autenticación y los listeners de datos en tiempo real
  useEffect(() => {
    let unsubscribeProducts: () => void;
    let unsubscribeMovements: () => void;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Usuario está logueado, buscar su perfil en Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if(userDocSnap.exists()) {
           setCurrentUser({ uid: user.uid, username: user.email!, ...userDocSnap.data() } as User);
           setAuthStatus('loggedIn');
           
           // Configurar listeners en tiempo real para productos
           const productsQuery = query(collection(db, "products"), orderBy("name"));
           unsubscribeProducts = onSnapshot(productsQuery, (querySnapshot) => {
               const productsList = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Product[];
               setProducts(productsList);
           }, (error) => {
               console.error("Error al obtener productos en tiempo real:", error);
           });

           // Configurar listeners en tiempo real para movimientos
           const movementsQuery = query(collection(db, "movements"), orderBy("date", "desc"), orderBy("time", "desc"));
           unsubscribeMovements = onSnapshot(movementsQuery, (querySnapshot) => {
               const movementsList = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Movement[];
               setMovements(movementsList);
           }, (error) => {
               console.error("Error al obtener movimientos en tiempo real:", error);
           });

        } else {
           // Perfil no encontrado, probablemente un error. Desloguear.
           await signOut(auth);
           setAuthStatus('login');
        }
      } else {
        // No hay usuario logueado, limpiar y desuscribirse de los listeners
        setCurrentUser(null);
        setProducts([]);
        setMovements([]);
        setAuthStatus('login');
        if (unsubscribeProducts) unsubscribeProducts();
        if (unsubscribeMovements) unsubscribeMovements();
      }
    });

    // Función de limpieza al desmontar el componente
    return () => {
      unsubscribeAuth();
      if (unsubscribeProducts) unsubscribeProducts();
      if (unsubscribeMovements) unsubscribeMovements();
    };
  }, []);

  const handleLogin = async (username: string, password_param: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, username, password_param);
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };
  
  const handlePasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      await sendPasswordResetEmail(auth, email);
      // Por seguridad, siempre mostramos un mensaje genérico para no revelar qué correos están registrados.
      return { success: true, message: 'Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña.' };
    } catch (error: any) {
      console.error("Password reset error:", error);
      // Aún en caso de error (ej. usuario no encontrado), devolvemos el mismo mensaje genérico.
      return { success: true, message: 'Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña.' };
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleRegister = async (newUser: User): Promise<{ success: boolean, message: string }> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, newUser.username, newUser.password!);
      const { user } = userCredential;
      
      const userProfile = {
        name: newUser.name,
        role: newUser.role,
        username: newUser.username
      };

      // Guardar información adicional del usuario en Firestore
      await setDoc(doc(db, "users", user.uid), userProfile);
      
      // FIX: Establecer manualmente el usuario y el estado de autenticación para evitar condiciones de carrera.
      // Los listeners en tiempo real se encargarán de cargar los datos.
      setCurrentUser({ uid: user.uid, ...userProfile });
      setAuthStatus('loggedIn');

      return { success: true, message: '¡Usuario registrado con éxito!' };
    } catch (error: any) {
        console.error("Registration error details:", error);
        switch (error.code) {
            case 'auth/email-already-in-use':
                return { success: false, message: 'El correo electrónico ya está en uso por otra cuenta.' };
            case 'auth/invalid-email':
                return { success: false, message: 'El formato del correo electrónico no es válido.' };
            case 'auth/weak-password':
                return { success: false, message: 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.' };
            default:
                return { success: false, message: 'Ocurrió un error durante el registro. Por favor, inténtalo de nuevo.' };
        }
    }
  };

  const handleRegisterMovement = async (newMovement: Omit<Movement, 'id' | 'date' | 'time' | 'productName'>): Promise<{ success: boolean, message: string }> => {
    const productRef = doc(db, 'products', newMovement.productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return { success: false, message: 'Producto no encontrado.' };
    }

    const product = productSnap.data() as Product;

    if (newMovement.type === 'salida' && newMovement.quantity > product.quantity) {
      return { success: false, message: `No hay stock suficiente para ${product.name}. Stock actual: ${product.quantity}.` };
    }

    const newQuantity = newMovement.type === 'entrada' 
      ? product.quantity + newMovement.quantity 
      : product.quantity - newMovement.quantity;

    const fullMovement: Omit<Movement, 'id'> = {
      ...newMovement,
      productName: product.name,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    try {
        const batch = writeBatch(db);
        batch.update(productRef, { quantity: newQuantity });
        const movementRef = doc(collection(db, 'movements'));
        batch.set(movementRef, fullMovement);
        await batch.commit();

        setMovementModal({ isOpen: false });
        return { success: true, message: 'Movimiento registrado con éxito.' };
    } catch (error) {
        console.error("Error registering movement:", error);
        return { success: false, message: 'Error al registrar el movimiento.' };
    }
  };
  
  const handleAddProduct = async (newProductData: Omit<Product, 'id'>): Promise<{ success: boolean, message: string }> => {
    try {
      // Generar código automáticamente para asegurar unicidad y secuencia
      const existingCodes = products.map(p => parseInt(p.code, 10)).filter(n => !isNaN(n));
      const maxCode = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
      const nextCode = (maxCode + 1).toString().padStart(3, '0');

      const productToSave = { ...newProductData, code: nextCode };

      const newProductRef = await addDoc(collection(db, 'products'), productToSave);

      // Si hay stock inicial, registrarlo como una entrada
      if (productToSave.quantity > 0) {
        const initialMovement: Omit<Movement, 'id'> = {
            productId: newProductRef.id,
            productName: productToSave.name,
            type: 'entrada',
            quantity: productToSave.quantity,
            date: new Date().toISOString().slice(0, 10),
            time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            user: currentUser!.username,
            reason: 'Stock inicial de nuevo producto',
        };
        await addDoc(collection(db, 'movements'), initialMovement);
      }
      return { success: true, message: 'Producto agregado exitosamente.' };
    } catch (error) {
      console.error("Error adding product:", error);
      return { success: false, message: 'Error al agregar el producto.' };
    }
  };

  const handleEditProduct = async (productId: string, updatedData: Omit<Product, 'id'>): Promise<{ success: boolean, message: string }> => {
    try {
        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
            return { success: false, message: 'Producto no encontrado.' };
        }

        const oldProduct = productSnap.data() as Product;
        const oldQuantity = oldProduct.quantity;
        const newQuantity = updatedData.quantity;

        const batch = writeBatch(db);

        // 1. Actualizar el documento del producto con todos los datos nuevos
        batch.update(productRef, updatedData as any);

        // 2. Si la cantidad de stock cambió, crear un documento de movimiento
        const quantityDiff = newQuantity - oldQuantity;
        
        if (quantityDiff !== 0) {
            const movementType = quantityDiff > 0 ? 'entrada' : 'salida';
            const movementQuantity = Math.abs(quantityDiff);

            const movementData: Omit<Movement, 'id'> = {
                productId: productId,
                productName: updatedData.name, // Usar el nombre actualizado
                type: movementType,
                quantity: movementQuantity,
                date: new Date().toISOString().slice(0, 10),
                time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                user: currentUser!.username,
                reason: 'Ajuste de stock (edición manual)',
            };
            const movementRef = doc(collection(db, 'movements'));
            batch.set(movementRef, movementData);
        }

        // 3. Confirmar la operación atómica
        await batch.commit();
        return { success: true, message: 'Producto y stock actualizados exitosamente.' };

    } catch (error) {
        console.error("Error updating product and stock:", error);
        return { success: false, message: 'Error al actualizar el producto.' };
    }
  };


  const handleDeleteProduct = async (productId: string): Promise<{ success: boolean, message: string }> => {
    try {
        await deleteDoc(doc(db, "products", productId));
        return { success: true, message: `Producto eliminado.` };
    } catch (error) {
        console.error("Error deleting product:", error);
        return { success: false, message: 'Error al eliminar el producto.' };
    }
  };

  const handleThresholdChange = (newThreshold: number) => {
      setLowStockThreshold(newThreshold);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard products={products} movements={movements} />;
      case 'products': return <Products products={products} movements={movements} onAddProduct={handleAddProduct} onEditProduct={handleEditProduct} onDeleteProduct={handleDeleteProduct} currentUser={currentUser!} lowStockThreshold={lowStockThreshold} />;
      case 'scanner': return <Scanner products={products} onOpenMovementModal={(productId) => setMovementModal({ isOpen: true, initialProductId: productId })} />;
      case 'movements': return <Movements movements={movements} onOpenMovementModal={() => setMovementModal({ isOpen: true })} />;
      case 'reports': return <Reports products={products} movements={movements} />;
      case 'settings': return <Settings users={[currentUser!]} currentUser={currentUser!} lowStockThreshold={lowStockThreshold} onThresholdChange={handleThresholdChange} />;
      default: return <Dashboard products={products} movements={movements} />;
    }
  };

  if (authStatus === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (authStatus === 'login') {
    return <Login onLogin={handleLogin} onNavigateToRegister={() => setAuthStatus('register')} onPasswordReset={handlePasswordReset} />;
  }

  if (authStatus === 'register') {
    return <Register onRegister={handleRegister} onNavigateToLogin={() => setAuthStatus('login')} />;
  }

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans text-slate-900">
       <Sidebar 
         currentView={currentView} 
         onViewChange={setCurrentView} 
         onLogout={handleLogout} 
         currentUser={currentUser!} 
         isOpen={isSidebarOpen}
         onClose={() => setIsSidebarOpen(false)}
       />
       <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300">
          <Header 
            title={currentView} 
            currentUser={currentUser!} 
            lowStockProducts={products.filter(p => p.quantity < lowStockThreshold)} 
            onMenuClick={() => setIsSidebarOpen(true)}
          />
          <main className="flex-1 overflow-y-auto">
             {renderView()}
          </main>
       </div>
       <Chatbot products={products} />
       {movementModal.isOpen && (
         <RegisterMovementModal
           products={products}
           currentUser={currentUser!}
           initialProductId={movementModal.initialProductId}
           onClose={() => setMovementModal({ isOpen: false })}
           onRegister={handleRegisterMovement}
         />
       )}
    </div>
  );
};

export default App;
