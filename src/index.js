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
						const paymentData = await request.json();
						const { customer_id, amount, payment_method, notes } = paymentData;

						console.log('💰 Payment POST received:', { customer_id, amount, payment_method, notes });

						const result = await env.DB.prepare(`
							INSERT INTO payments (customer_id, amount, payment_method, notes)
							VALUES (?, ?, ?, ?)
						`).bind(customer_id, amount, payment_method || 'nakit', notes || null).run();

						console.log('💰 Payment POST result:', result);

						return new Response(JSON.stringify({
							id: result.meta.last_row_id,
							customer_id: customer_id,
							amount: amount,
							payment_method: payment_method || 'nakit',
							notes: notes || null,
							message: 'Ödeme başarıyla kaydedildi'
						}), {
							status: 201,
							headers: {
								'Content-Type': 'application/json',
								...corsHeaders
							}
						});
					} catch (error) {
						console.error('💰 Payment POST error:', error);
						return new Response(JSON.stringify({
							error: 'Ödeme kaydedilirken hata oluştu',
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
						
						// Get product info to calculate unit_price and total_amount
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
						
						const result = await env.DB.prepare(`
							INSERT INTO deliveries (customer_id, product_id, quantity, unit_price, total_amount, delivery_date, notes)
							VALUES (?, ?, ?, ?, ?, ?, ?)
						`).bind(customerId, productId, quantity, unit_price, total_amount, formattedDate, note || null).run();
						
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
							message: 'Teslimat başarıyla kaydedildi'
						}), {
							status: 201,
							headers: {
								'Content-Type': 'application/json',
								...corsHeaders
							}
						});
					} catch (error) {
						console.error('Delivery error:', error);
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