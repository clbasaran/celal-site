			// Receipt record endpoint
			if (pathname === '/api/receipts/record') {
				if (request.method === 'POST') {
					const receiptData = await request.json();
					const { document_number, customer_id, type, reference_id } = receiptData;
					
					const result = await env.DB.prepare(`
						INSERT INTO receipt_records (document_number, customer_id, type, reference_id)
						VALUES (?, ?, ?, ?)
					`).bind(document_number, customer_id, type, reference_id).run();
					
					return new Response(JSON.stringify({
						id: result.meta.last_row_id,
						message: 'Fiş kaydı başarıyla oluşturuldu'
					}), {
						status: 201,
						headers: {
							'Content-Type': 'application/json',
							...corsHeaders
						}
					});
				}
			}

			// Single payment endpoints
			if (pathname.match(/^\/api\/payments\/(\d+)$/)) {
				const paymentId = pathname.split('/').pop();
				
				if (request.method === 'PUT') {
					const paymentData = await request.json();
					const { amount, payment_method, notes } = paymentData;
					
					const result = await env.DB.prepare(`
						UPDATE payments 
						SET amount = ?, payment_method = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
						WHERE id = ?
					`).bind(amount, payment_method, notes, paymentId).run();
					
					if (result.changes === 0) {
						return new Response(JSON.stringify({
							error: 'Ödeme bulunamadı'
						}), {
							status: 404,
							headers: {
								'Content-Type': 'application/json',
								...corsHeaders
							}
						});
					}
					
					return new Response(JSON.stringify({
						message: 'Ödeme başarıyla güncellendi'
					}), {
						headers: {
							'Content-Type': 'application/json',
							...corsHeaders
						}
					});
				}
				
				if (request.method === 'DELETE') {
					const result = await env.DB.prepare(
						'DELETE FROM payments WHERE id = ?'
					).bind(paymentId).run();
					
					if (result.changes === 0) {
						return new Response(JSON.stringify({
							error: 'Ödeme bulunamadı'
						}), {
							status: 404,
							headers: {
								'Content-Type': 'application/json',
								...corsHeaders
							}
						});
					}
					
					return new Response(JSON.stringify({
						message: 'Ödeme başarıyla silindi'
					}), {
						headers: {
							'Content-Type': 'application/json',
							...corsHeaders
						}
					});
				}
			}

			// Payments endpoints
			if (pathname === '/api/payments') {
				if (request.method === 'GET') {
					// Get all payments
					const payments = await env.DB.prepare(`
						SELECT p.*, c.name as customer_name
						FROM payments p
						LEFT JOIN customers c ON p.customer_id = c.id
						ORDER BY p.created_at DESC
						LIMIT 50
					`).all();
					
					return new Response(JSON.stringify(payments.results || []), {
						headers: {
							'Content-Type': 'application/json',
							...corsHeaders
						}
					});
				}
				
				if (request.method === 'POST') {
					try {
						const stockData = await request.json();
						const { customer_id, amount, payment_method, notes, products } = stockData;

						console.log('📦 Stock Entry POST received:', { customer_id, amount, payment_method, notes, products });

						// For stock entries, amount is optional - calculate from products if available
						let calculatedAmount = amount || 0;
						if (products && products.length > 0) {
							// For now, set amount to 0 for stock entries as we don't track prices
							calculatedAmount = 0;
						}

						const result = await env.DB.prepare(`
							INSERT INTO payments (customer_id, amount, payment_method, notes)
							VALUES (?, ?, ?, ?)
						`).bind(customer_id, calculatedAmount, payment_method || 'stok_girisi', notes || null).run();

						console.log('📦 Stock Entry POST result:', result);

						// Process products and update customer stocks
						if (products && products.length > 0) {
							for (const product of products) {
								// Check if customer already has this product
								const existingStock = await env.DB.prepare(`
									SELECT * FROM customer_stocks 
									WHERE customer_id = ? AND product_id = ?
								`).bind(customer_id, product.id).first();

								if (existingStock) {
									// Update existing stock
									await env.DB.prepare(`
										UPDATE customer_stocks 
										SET quantity = quantity + ?, last_updated = CURRENT_TIMESTAMP
										WHERE customer_id = ? AND product_id = ?
									`).bind(product.quantity, customer_id, product.id).run();
								} else {
									// Create new stock entry
									await env.DB.prepare(`
										INSERT INTO customer_stocks (customer_id, product_id, quantity)
										VALUES (?, ?, ?)
									`).bind(customer_id, product.id, product.quantity).run();
								}
							}
						}

						return new Response(JSON.stringify({
							payment: {
								id: result.meta.last_row_id,
								customer_id: customer_id,
								amount: calculatedAmount,
								payment_method: payment_method || 'stok_girisi',
								notes: notes || null,
								products: products || []
							},
							message: 'Stok girişi başarıyla kaydedildi'
						}), {
							status: 201,
							headers: {
								'Content-Type': 'application/json',
								...corsHeaders
							}
						});
					} catch (error) {
						console.error('📦 Stock Entry POST error:', error);
						return new Response(JSON.stringify({
							error: 'Stok girişi kaydedilirken hata oluştu',
							details: error.message,
							stack: error.stack
						}), {
							status: 500,
							headers: {
								'Content-Type': 'application/json',
								...corsHeaders
							}
						});
					}
				}
			}

			// Deliveries endpoints
			if (pathname === '/api/deliveries') {
				if (request.method === 'GET') {
					// Get all deliveries
					const deliveries = await env.DB.prepare(`
						SELECT d.*, p.name as product_name, c.name as customer_name
						FROM deliveries d
						LEFT JOIN products p ON d.product_id = p.id
						LEFT JOIN customers c ON d.customer_id = c.id
						ORDER BY d.delivery_date DESC
						LIMIT 50
					`).all();
					
					return new Response(JSON.stringify(deliveries.results || []), {
						headers: {
							'Content-Type': 'application/json',
							...corsHeaders
						}
					});
				}
				
				if (request.method === 'POST') {
					try {
						const deliveryData = await request.json();
						const { customerId, productId, productName, quantity, unit, deliveryDate, note } = deliveryData;
						
						console.log('🚛 Delivery POST received:', { customerId, productId, productName, quantity, unit, deliveryDate, note });
						
						// Check customer stock before delivery
						const customerStock = await env.DB.prepare(`
							SELECT * FROM customer_stocks 
							WHERE customer_id = ? AND product_id = ?
						`).bind(customerId, productId).first();
						
						if (!customerStock) {
							return new Response(JSON.stringify({
								error: 'Müşteride bu ürün stoğu bulunmuyor',
								type: 'NO_STOCK'
							}), {
								status: 400,
								headers: {
									'Content-Type': 'application/json',
									...corsHeaders
								}
							});
						}
						
						if (customerStock.quantity < quantity) {
							return new Response(JSON.stringify({
								error: `Yetersiz stok! Mevcut: ${customerStock.quantity} ${unit}, İstenen: ${quantity} ${unit}`,
								type: 'INSUFFICIENT_STOCK',
								available: customerStock.quantity,
								requested: quantity,
								unit: unit
							}), {
								status: 400,
								headers: {
									'Content-Type': 'application/json',
									...corsHeaders
								}
							});
						}
						
						// Get product info
						const product = await env.DB.prepare(
							'SELECT * FROM products WHERE id = ?'
						).bind(productId).first();
						
						if (!product) {
							return new Response(JSON.stringify({
								error: 'Ürün bulunamadı'
							}), {
								status: 404,
								headers: {
									'Content-Type': 'application/json',
									...corsHeaders
								}
							});
						}
						
						const unit_price = product.price || 0;
						const total_amount = (product.price || 0) * quantity;
						
						// Convert deliveryDate to proper format
						const formattedDate = deliveryDate ? new Date(deliveryDate).toISOString() : new Date().toISOString();
						
						// Create delivery record
						const result = await env.DB.prepare(`
							INSERT INTO deliveries (customer_id, product_id, quantity, unit_price, total_amount, delivery_date, notes)
							VALUES (?, ?, ?, ?, ?, ?, ?)
						`).bind(customerId, productId, quantity, unit_price, total_amount, formattedDate, note || null).run();
						
						// Update customer stock (subtract delivered quantity)
						const newQuantity = customerStock.quantity - quantity;
						await env.DB.prepare(`
							UPDATE customer_stocks 
							SET quantity = ?, last_updated = CURRENT_TIMESTAMP
							WHERE customer_id = ? AND product_id = ?
						`).bind(newQuantity, customerId, productId).run();
						
						console.log(`🚛 Stock updated: ${customerStock.quantity} -> ${newQuantity} ${unit}`);
						
						return new Response(JSON.stringify({
							delivery: {
								id: result.meta.last_row_id,
								customer_id: customerId,
								product_id: productId,
								productName: productName,
								quantity: quantity,
								unit: unit,
								unit_price: unit_price,
								total_amount: total_amount,
								date: deliveryDate,
								notes: note
							},
							remainingStock: newQuantity,
							message: 'Teslimat başarıyla kaydedildi'
						}), {
							status: 201,
							headers: {
								'Content-Type': 'application/json',
								...corsHeaders
							}
						});
					} catch (error) {
						console.error('🚛 Delivery error:', error);
						return new Response(JSON.stringify({
							error: 'Teslimat kaydedilirken hata oluştu',
							details: error.message
						}), {
							status: 500,
							headers: {
								'Content-Type': 'application/json',
								...corsHeaders
							}
						});
					}
				}
			}

			// Customer deliveries endpoint
			if (pathname.match(/^\/api\/deliveries\/customer\/(\d+)$/)) {
				const customerId = pathname.split('/').pop();
				
				if (request.method === 'GET') {
					const deliveries = await env.DB.prepare(`
						SELECT d.*, p.name as product_name, c.name as customer_name
						FROM deliveries d
						JOIN products p ON d.product_id = p.id
						JOIN customers c ON d.customer_id = c.id
						WHERE d.customer_id = ?
						ORDER BY d.delivery_date DESC
					`).bind(customerId).all();
					
					return new Response(JSON.stringify(deliveries.results), {
						headers: {
							'Content-Type': 'application/json',
							...corsHeaders
						}
					});
				}
			}

			// Single delivery endpoints
			if (pathname.match(/^\/api\/deliveries\/(\d+)$/)) {
				const deliveryId = pathname.split('/').pop();
				
				if (request.method === 'PUT') {
					const deliveryData = await request.json();
					const { quantity, unit_price, total_amount, notes } = deliveryData;
					
					const result = await env.DB.prepare(`
						UPDATE deliveries 
						SET quantity = ?, unit_price = ?, total_amount = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
						WHERE id = ?
					`).bind(quantity, unit_price, total_amount, notes, deliveryId).run();
					
					if (result.changes === 0) {
						return new Response(JSON.stringify({
							error: 'Teslimat bulunamadı'
						}), {
							status: 404,
							headers: {
								'Content-Type': 'application/json',
								...corsHeaders
							}
						});
					}
					
					return new Response(JSON.stringify({
						message: 'Teslimat başarıyla güncellendi'
					}), {
						headers: {
							'Content-Type': 'application/json',
							...corsHeaders
						}
					});
				}
			}

			// Customer specific payments endpoint
			if (pathname.match(/^\/api\/payments\/customer\/(\d+)$/)) {
				const customerId = pathname.split('/').pop();
				
				if (request.method === 'GET') {
					const payments = await env.DB.prepare(`
						SELECT p.*, c.name as customer_name
						FROM payments p
						LEFT JOIN customers c ON p.customer_id = c.id
						WHERE p.customer_id = ?
						ORDER BY p.created_at DESC
					`).bind(customerId).all();
					
					return new Response(JSON.stringify(payments.results || []), {
						headers: {
							'Content-Type': 'application/json',
							...corsHeaders
						}
					});
				}
			}

			// Customer specific receipts - FIX: created_at yerine printed_at kullan
			if (pathname.match(/^\/api\/receipts\/customer\/(\d+)$/)) {
				const customerId = pathname.split('/').pop();
				
				if (request.method === 'GET') {
					const receipts = await env.DB.prepare(`
						SELECT r.*, c.name as customer_name
						FROM receipt_records r
						LEFT JOIN customers c ON r.customer_id = c.id
						WHERE r.customer_id = ?
						ORDER BY r.created_at DESC
						LIMIT 50
					`).bind(customerId).all();
					
					return new Response(JSON.stringify(receipts.results || []), {
						headers: {
							'Content-Type': 'application/json',
							...corsHeaders
						}
					});
				}
			}