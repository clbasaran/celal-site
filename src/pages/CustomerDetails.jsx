                  <div className="p-6">
                    <AddDeliveryForm 
                      customerId={parseInt(id)}
                      onSubmit={handleDeliverySubmit}
                      loading={submittingDelivery}
                      availableProducts={customerStocks}
                    />
                  </div> 